from flask import Flask
import sqlite3

app = Flask(__name__)

# Import your routes here
from app import routes
