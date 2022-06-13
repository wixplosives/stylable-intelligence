// significant portions of this file were originally copied from Microsoft's vscode-languageserver-node sources
// at commit 059dc8612d9cb72ec86c69beba3839ce02febfd9

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
 * is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------------------------------ */

import { Duplex } from 'stream';

import { Connection, createConnection } from 'vscode-languageserver/node';
import { expect, plan, obj } from '../testkit/chai.spec';
import { ErrorCodes, RequestType } from 'vscode-languageserver-protocol';
import { StreamConnectionClient } from './stream-connection-client';

class TestDuplex extends Duplex {
    constructor(private name: string = 'ds1', private dbg = false) {
        super();
    }

    public _write(chunk: string | Buffer, _encoding: string, done: () => void) {
        if (this.dbg) {
            console.log(this.name + ': write: ' + chunk.toString());
        }
        setImmediate(() => {
            this.emit('data', chunk);
        });
        done();
    }

    public _read(_size: number) {
        /**/
    }
}

export class TestConnection {
    private duplexStream1 = new TestDuplex('ds1');
    private duplexStream2 = new TestDuplex('ds2');
    public server = createConnection(this.duplexStream2, this.duplexStream1);
    public client = new StreamConnectionClient(this.duplexStream1, this.duplexStream2);

    public listen(): void {
        this.server.listen();
        this.client.listen();
    }

    // public dispose() {
    //     this.server.dispose();
    //     this.client.dispose();
    // }
}

// adapted from https://github.com/Microsoft/vscode-languageserver-node/blob/master/jsonrpc/src/test/connection.test.ts

describe('LSP connection test driver', () => {
    it(
        'Test Duplex Stream',
        plan(1, () => {
            const stream = new TestDuplex('ds1');
            stream.on('data', (chunk) => {
                // eslint-disable-next-line
                expect(chunk.toString()).to.eql('Hello World');
            });
            stream.write('Hello World');
        })
    );

    it(
        'Test Duplex Stream Connection',
        plan(1, () => {
            const type = new RequestType<string, string, void>('test/foo');
            const inputStream = new TestDuplex('ds1');
            const outputStream = new TestDuplex('ds2');
            const connection = createConnection(inputStream, outputStream);
            connection.listen();
            let content = '';
            outputStream.on('data', (chunk) => {
                // eslint-disable-next-line
                content += chunk.toString() as string;
                const match = content.match(/Content-Length:\s*(\d+)\s*/);
                if (match) {
                    const contentLength = Number(match[1]);
                    if (content.length === match[0].length + contentLength) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        const message = JSON.parse(content.substr(contentLength * -1));
                        expect(message).to.deep.contain({
                            method: 'test/foo',
                            params: ['bar'],
                        });
                    }
                }
            });
            // eslint-disable-next-line @typescript-eslint/unbound-method
            connection.sendRequest(type, 'bar').catch(console.error);
        })
    );

    describe('TestConnection', () => {
        let testCon: TestConnection;
        beforeEach(() => {
            testCon = new TestConnection();
            testCon.listen();
        });
        describe('onRequest', () => {
            const testRequest = new RequestType<string, string, void>('test/foo');
            it(
                'Handle Single Request',
                plan(2, async () => {
                    testCon.server.onRequest(testRequest, (p1) => {
                        expect(p1).to.equal('argument');
                        return 'result';
                    });
                    const result = await testCon.client.sendRequest(testRequest, 'argument');
                    expect(result).to.equal('result');
                })
            );

            it(
                'Handle Multiple Requests',
                plan(1, async () => {
                    testCon.server.onRequest(testRequest, (p1) => {
                        return `${p1}1`;
                    });
                    const promises: Array<Thenable<string>> = [];
                    promises.push(testCon.client.sendRequest(testRequest, 'foo'));
                    promises.push(testCon.client.sendRequest(testRequest, 'bar'));

                    const values = await Promise.all(promises);
                    expect(values).to.eql(['foo1', 'bar1']);
                })
            );

            it(
                'Unhandled Request',
                plan(1, async () => {
                    try {
                        await testCon.client.sendRequest(testRequest, 'foo');
                    } catch (error) {
                        expect((error as NodeJS.ErrnoException)?.code).to.eql(ErrorCodes.MethodNotFound);
                    }
                })
            );
        });
        describe('connection client', () => {
            function testRequestFromClient(clientMethod: keyof StreamConnectionClient, serverMethod: keyof Connection) {
                it(
                    `.${clientMethod}()`,
                    plan(2, async () => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                        (testCon.server[serverMethod] as any)((p: any) => {
                            expect(p).to.contain(obj(1));
                            return obj(2);
                        });
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                        const response = await (testCon.client[clientMethod] as any)(obj(1));
                        expect(response).to.contain(obj(2));
                    })
                );
            }
            function testNotificationToClient(
                clientMethod: keyof StreamConnectionClient,
                serverMethod: keyof Connection
            ) {
                it(
                    `.${clientMethod}()`,
                    plan(1, () => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                        (testCon.client[clientMethod] as any)((p: any) => {
                            expect(p).to.contain(obj(1));
                        });
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                        (testCon.server[serverMethod] as any)(obj(1));
                    })
                );
            }

            testRequestFromClient('initialize', 'onInitialize');
            testRequestFromClient('completion', 'onCompletion');
            testRequestFromClient('definition', 'onDefinition');
            testRequestFromClient('hover', 'onHover');
            testRequestFromClient('references', 'onReferences');
            testRequestFromClient('rename', 'onRenameRequest');
            testRequestFromClient('signatureHelp', 'onSignatureHelp');
            testRequestFromClient('documentColor', 'onDocumentColor');
            testRequestFromClient('colorPresentation', 'onColorPresentation');
            testNotificationToClient('onDiagnostics', 'sendDiagnostics');
        });
    });
});
