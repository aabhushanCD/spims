import { setupServer } from "msw/node";

/**
 * Tests register request handlers with `server.use(...)`. Unhandled requests
 * fall through with MSW's default warning behavior, so components can render
 * without every optional query being mocked. Register handlers for any request
 * whose behavior the test asserts.
 */
export const server = setupServer();

export default server;
