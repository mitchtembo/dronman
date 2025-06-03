import JSDOMEnvironment from 'jest-environment-jsdom';

/**
 * A custom Jest environment to provide Web API globals (Request, Response, Headers)
 * for testing Next.js API routes.
 */
class CustomApiEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    // Define global Web API objects if they are not already defined by JSDOM
    if (typeof global.Request === 'undefined') {
      global.Request = class MockRequest {
        constructor(input, init) {
          this.url = input;
          this.headers = new Headers(init?.headers);
          this.json = jest.fn(() => Promise.resolve(init?.json));
          this.method = init?.method || 'GET';
        }
      };
    }

    if (typeof global.Response === 'undefined') {
      global.Response = class MockResponse {
        constructor(body, init) {
          this.body = body;
          this.status = init?.status || 200;
          this.headers = new Headers(init?.headers);
          this.json = jest.fn(() => Promise.resolve(body));
        }
      };
    }

    if (typeof global.Headers === 'undefined') {
      global.Headers = class MockHeaders extends Map {
        constructor(init) {
          super(init);
        }
        get(name) {
          return this.has(name.toLowerCase()) ? super.get(name.toLowerCase()) : null;
        }
        set(name, value) {
          return super.set(name.toLowerCase(), value);
        }
      };
    }
  }

  async teardown() {
    await super.teardown();
  }
}

export default CustomApiEnvironment;
