import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as path from 'path';

const packageDef = loader.loadSync(path.resolve(__dirname, 'sample.proto'));
const pkgDef = grpc.loadPackageDefinition(packageDef);

const store = new Map<string, string>();

interface SampleHandlers {
  setValue: grpc.handleUnaryCall<{ key: string; value: string }, { value: string }>;
  getValue: grpc.handleUnaryCall<{ key: string }, { value: string }>;
  getValueStream: grpc.handleBidiStreamingCall<{ key: string }, { value: string }>;
}
const implementation: grpc.UntypedServiceImplementation & SampleHandlers = {
  setValue(call, callback) {
    const key = call.request.key;
    store.set(key, call.request.value);
    callback(null, { value: store.get(key) || '' });
  },

  getValue(call, callback) {
    const key = call.request.key;
    callback(null, { value: store.get(key) || '' });
  },

  getValueStream(call) {
    call.on('data', (value) => {
      const key = value.key;
      if (key) {
        const value = store.get(key) || '';
        call.write({ value });
      }
    });
    call.on('end', () => {
      call.end();
    });
  },
};

function main() {
  const server = new grpc.Server();

  server.addService(getServiceDefinition(pkgDef, 'sample.KeyValueStore'), implementation);
  const port = '0.0.0.0:50051';
  server.bindAsync(port, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`SampleServer started on ${port}`);
  });
}

function getServiceDefinition(packageDef: grpc.GrpcObject, name: string): grpc.ServiceDefinition {
  const names = name.split('.');
  let svc: any = packageDef;
  while (names.length > 0) {
    const currentName = names.shift();
    svc = svc[currentName];
    if (!svc) throw new Error(`Cannot find service ${name}, namespace ${currentName} not found`);
  }
  if (!isServiceConstructor(svc)) throw new Error(`Cannot find service ${name}`);
  return svc.service;
}

function isServiceConstructor(obj: any): obj is grpc.ServiceClientConstructor {
  return obj && 'service' in obj && 'serviceName' in obj;
}

main();
