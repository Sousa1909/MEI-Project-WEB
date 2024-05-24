from flask import Flask

app = Flask(__name__)

# Import your routes here
from app import routes
