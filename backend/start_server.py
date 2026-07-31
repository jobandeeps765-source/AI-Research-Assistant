import sys
import logging

logging.basicConfig(level=logging.DEBUG, stream=sys.stderr)

import uvicorn
from app.main import app

uvicorn.run(app, host="127.0.0.1", port=8000, log_level="debug")
