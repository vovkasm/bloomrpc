import {ipcRenderer} from 'electron';
import * as path from 'path';
import {Proto, ProtoFile, ProtoService, ServiceMethodsPayload, walkServices} from './protobuf';
import isURL, { IsURLOptions } from 'validator/lib/isURL';
import * as loader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';
import * as protobuf from 'protobufjs';
import { v4 as uuidv4 } from 'uuid'

const commonProtosPath = [
  // @ts-ignore
  path.join(__static),
];

export type OnProtoUpload = (protoFiles: ProtoFile[], err?: Error) => void

/**
 * Upload protofiles
 * @param onProtoUploaded
 * @param importPaths
 */
export async function importProtos(onProtoUploaded: OnProtoUpload, importPaths?: string[]) {
  const filePaths = await ipcRenderer.invoke('open-proto-files') as string[];
  await loadProtosFromFile(filePaths, importPaths, onProtoUploaded);
}

/**
 * Load protocol buffer files
 * @param filePaths
 * @param importPaths
 * @param onProtoUploaded
 */
export async function loadProtos(protoPaths: string[], importPaths?: string[], onProtoUploaded?: OnProtoUpload): Promise<ProtoFile[]> {
  let validateOptions: IsURLOptions = {
    require_tld: false,
    require_protocol: false,
    require_host: false,
    require_valid_protocol: false,
  }
  const protoFiles = protoPaths.filter((protoPath) => {
    return !isURL(protoPath, validateOptions);
  })

  const protoFileFromFiles = await loadProtosFromFile(protoFiles, importPaths, onProtoUploaded);

  return protoFileFromFiles;
}

/**
 * Load protocol buffer files from proto files
 * @param filePaths
 * @param importPaths
 * @param onProtoUploaded
 */
export async function loadProtosFromFile(filePaths: string[], importPaths?: string[], onProtoUploaded?: OnProtoUpload): Promise<ProtoFile[]> {
  try {
    const protos = await Promise.all(filePaths.map(async (filePath) => {
      const root = await protobuf.load(filePath);
      const packageDef = loader.fromJSON(root.toJSON(), {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [...(importPaths ? importPaths : []), ...commonProtosPath],
      });
      const ast = grpc.loadPackageDefinition(packageDef);
      const proto: Proto = {
        fileName: path.basename(filePath),
        filePath,
        protoText: '',
        ast: ast as any,
        root
      };
      return proto;
    }));

    const protoList = protos.reduce((list: ProtoFile[], proto: Proto) => {

      // Services with methods
      const services = parseServices(proto);

      // Proto file
      list.push({
        proto,
        fileName: proto.fileName.split(path.sep).pop() || "",
        services,
      });

      return list;
    }, []);
    onProtoUploaded && onProtoUploaded(protoList, undefined);
    return protoList;

  } catch (e) {
    console.error(e);
    onProtoUploaded && onProtoUploaded([], e);

    if (!onProtoUploaded) {
      throw e;
    }

    return [];
  }
}

type StackDepth = {
  [type: string]: number;
};

/**
 * Parse Grpc services from root
 * @param proto
 */
function parseServices(proto: Proto) {

  const services: {[key: string]: ProtoService} = {};

  walkServices(proto, (service, serviceName) => {
    const root = service.root;
    const serviceMethods = service.methods;

    const methods: ServiceMethodsPayload = {};
    const names = Object.keys(serviceMethods);
    for (const methodName of names) {
      const serviceMethod = serviceMethods[methodName];
      const messageType = root.lookupType(serviceMethod.requestType);

      const mockTypeFields = (type: protobuf.Type, stackDepth: StackDepth = {}) => {
        const mockField = (field: protobuf.Field, stackDepth: StackDepth): any => {
          const mockEnum = (enumType: protobuf.Enum): number => {
            return Object.values(enumType.values)[0];
          }
          const interpretMockViaFieldName = (fieldName: string): string => {
            const fieldNameLower = fieldName.toLowerCase();
            if (fieldNameLower.startsWith('id') || fieldNameLower.endsWith('id')) {
              return uuidv4();
            }
            return 'Hello';
          }
          const mockScalar = (type: string, fieldName: string): any => {
            switch (type) {
            case 'string':
              return interpretMockViaFieldName(fieldName);
            case 'number':
              return 10;
            case 'bool':
              return true;
            case 'int32':
              return 10;
            case 'int64':
              return 20;
            case 'uint32':
              return 100;
            case 'uint64':
              return 100;
            case 'sint32':
              return 100;
            case 'sint64':
              return 1200;
            case 'fixed32':
              return 1400;
            case 'fixed64':
              return 1500;
            case 'sfixed32':
              return 1600;
            case 'sfixed64':
              return 1700;
            case 'double':
              return 1.4;
            case 'float':
              return 1.1;
            case 'bytes':
              return Buffer.from('Hello');
            default:
              return null;
            }
          }
          const pickOneOf = (oneOfs: protobuf.OneOf[], stackDepth: StackDepth) => {
            const fields: {[index: string]: any} = {};
            for (const oneOf of oneOfs) {
              fields[oneOf.name] = mockField(oneOf.fieldsArray[0], stackDepth)
            }
            return fields;
          }

  
            if (field instanceof protobuf.MapField) {
              let mockPropertyValue = null;
              if (field.resolvedType === null) {
                mockPropertyValue = mockScalar(field.type, field.name);
              }
          
              if (mockPropertyValue === null) {
                const resolvedType = field.resolvedType;
          
                if (resolvedType instanceof protobuf.Type) {
                  if (resolvedType.oneofs) {
                    mockPropertyValue = pickOneOf(resolvedType.oneofsArray, stackDepth);
                  } else {
                    mockPropertyValue = mockTypeFields(resolvedType);
                  }
                } else if (resolvedType instanceof protobuf.Enum) {
                  mockPropertyValue = mockEnum(resolvedType);
                } else if (resolvedType === null) {
                  mockPropertyValue = {};
                }
              }
          
              return {
                [mockScalar(field.keyType, field.name)]: mockPropertyValue,
              };
            }
          
            if (field.resolvedType instanceof protobuf.Type) {
              return mockTypeFields(field.resolvedType, stackDepth);
            }
          
            if (field.resolvedType instanceof protobuf.Enum) {
              return mockEnum(field.resolvedType);
            }
          
            const mockPropertyValue = mockScalar(field.type, field.name);
          
            if (mockPropertyValue === null) {
              const resolvedField = field.resolve();
          
              return mockField(resolvedField, stackDepth);
            } else {
              return mockPropertyValue;
            }
        };

        const name = type.name;
        if (stackDepth[name] > 3) return {};
        stackDepth[name] = stackDepth[name] ? stackDepth[name] + 1 : 1;

        const fieldsData: { [key: string]: any } = {};
        for (const field of type.fieldsArray) {
          field.resolve();
          if (field.parent !== field.resolvedType) {
            if (field.repeated) {
              fieldsData[field.name] = [mockField(field, stackDepth)];
            } else {
              fieldsData[field.name] = mockField(field, stackDepth);
            }
          }
        }
        return fieldsData;
      };

      const data = mockTypeFields(messageType);
      methods[methodName] = () => {
        return {
          plain: data,
          message: messageType.fromObject(data),
        }
      }
    }

    services[serviceName] = {
      serviceName,
      proto,
      methodsMocks: methods,
      methodsName: Object.keys(methods),
    };
  });

  return services;
}

export async function importResolvePath(): Promise<string|undefined> {
    const filePaths = await ipcRenderer.invoke('open-directory') as string[];
    return filePaths[0] || undefined;
}
