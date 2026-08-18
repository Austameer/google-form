import http.server
import socketserver
import sqlite3
import json
import urllib.parse
import os

PORT = 3000
DB_FILE = 'database.sqlite'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT,
            department TEXT,
            section TEXT,
            student_contact TEXT,
            father_contact TEXT,
            mother_contact TEXT,
            bloombyte_option TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/admin':
            self.path = '/admin.html'
        elif self.path == '/api/responses':
            self.handle_get_responses()
            return
        
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/submit':
            self.handle_submit()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_submit(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            INSERT INTO responses (student_name, department, section, student_contact, father_contact, mother_contact, bloombyte_option)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('studentName'),
            data.get('department'),
            data.get('section'),
            data.get('studentContact'),
            data.get('fatherContact'),
            data.get('motherContact'),
            data.get('bloombyteOption')
        ))
        conn.commit()
        conn.close()

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))

    def handle_get_responses(self):
        password = self.headers.get('Authorization')
        if password != 'admin123':
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
            return

        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM responses ORDER BY created_at DESC')
        rows = c.fetchall()
        conn.close()

        responses = [dict(row) for row in rows]

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(responses).encode('utf-8'))

if __name__ == '__main__':
    init_db()
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()
