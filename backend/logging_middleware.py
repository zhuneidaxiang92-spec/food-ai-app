import time
import traceback
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class ExceptionLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            with open("error_log.txt", "a", encoding="utf-8") as f:
                f.write(f"--- Error at {time.ctime()} ---\n")
                f.write(f"URL: {request.url}\n")
                f.write(f"Method: {request.method}\n")
                f.write(f"Origin: {request.headers.get('origin')}\n")
                f.write(f"Error: {str(e)}\n")
                f.write(traceback.format_exc())
                f.write("\n")
            raise e
