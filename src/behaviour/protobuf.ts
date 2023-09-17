import { Message, Namespace, NamespaceBase, Root, Service } from 'protobufjs';
import { GrpcObject } from '@grpc/grpc-js';

export type Proto = {
  fileName: string;
  filePath: string;
  protoText: string;
  ast: GrpcObject;
  root: Root;
};

export interface ProtoFile {
  proto: Proto;
  fileName: string;
  services: ProtoServiceList;
}

export interface ProtoServiceList {
  [key: string]: ProtoService;
}

export interface ProtoService {
  proto: Proto;
  serviceName: string;
  methodsMocks: ServiceMethodsPayload;
  methodsName: string[];
}

export type ServiceMethodsPayload = {
  [name: string]: () => MethodPayload;
};

export type MethodPayload = {
  plain: {
    [key: string]: any;
  };
  message: Message;
};

export function walkServices(proto: Proto, onService: (service: Service, serviceName: string) => void): void {
  const walkNamespace = (ns: NamespaceBase) => {
    if (!ns.nested) return;

    const keys = Object.keys(ns.nested);
    for (const key of keys) {
      const nested = ns.root.lookup(`${ns.fullName}.${key}`);
      if (!nested) continue;

      if (nested instanceof Namespace) walkNamespace(nested);
      if (nested instanceof Service) {
        // remove first dot from full service name
        const fullName = nested.fullName.replace(/^\./, '');
        onService(nested, fullName);
      }
    }
  };

  walkNamespace(proto.root);
}
