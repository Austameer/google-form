import http.server
import socketserver
import json
import os

PORT = int(os.environ.get("PORT", 3000))
DATABASE_URL = os.environ.get("DATABASE_URL")  # Set automatically by Railway/Render

# ─── Database helpers ─────────────────────────────────────────────────────────

def get_conn():
    """Return a DB connection. Uses PostgreSQL on Render, SQLite locally."""
    if DATABASE_URL:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        return conn, 'pg'
    else:
        import sqlite3
        conn = sqlite3.connect('database.sqlite')
        conn.row_factory = sqlite3.Row
        return conn, 'sqlite'

def init_db():
    conn, db_type = get_conn()
    c = conn.cursor()
    if db_type == 'pg':
        c.execute('''
            CREATE TABLE IF NOT EXISTS responses (
                id SERIAL PRIMARY KEY,
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
    else:
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
    print(f"DB initialized ({'PostgreSQL' if db_type == 'pg' else 'SQLite'})")

# ─── HTTP Handler ─────────────────────────────────────────────────────────────

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
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            conn, db_type = get_conn()
            c = conn.cursor()
            placeholder = '%s' if db_type == 'pg' else '?'
            sql = f'''
                INSERT INTO responses
                    (student_name, department, section, student_contact,
                     father_contact, mother_contact, bloombyte_option)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder},
                        {placeholder}, {placeholder}, {placeholder})
            '''
            c.execute(sql, (
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
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))

        except Exception as e:
            print(f"Error in handle_submit: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_get_responses(self):
        password = self.headers.get('Authorization')
        if password != 'admin123':
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
            return

        try:
            conn, db_type = get_conn()
            c = conn.cursor()
            c.execute('SELECT * FROM responses ORDER BY created_at DESC')
            rows = c.fetchall()

            if db_type == 'pg':
                # Read column names BEFORE closing connection
                col_names = [desc[0] for desc in c.description]
                conn.close()
                responses = [dict(zip(col_names, row)) for row in rows]
                # Convert datetime objects to string for JSON serialization
                for r in responses:
                    if r.get('created_at'):
                        r['created_at'] = str(r['created_at'])
            else:
                conn.close()
                responses = [dict(row) for row in rows]

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(responses).encode('utf-8'))

        except Exception as e:
            print(f"Error in handle_get_responses: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

# ─── Start ────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        httpd.allow_reuse_address = True
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()
