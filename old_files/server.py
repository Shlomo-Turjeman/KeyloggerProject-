from http.server import HTTPServer, BaseHTTPRequestHandler
import os
import sys
import encryption as enc
import socket


PORT = 9685

def get_resource_path(relative_path):
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath("..")
    return os.path.join(base_path, relative_path)

def load_template():
    template_path = get_resource_path("index.html")
    with open(template_path, "r", encoding="utf-8") as file:
        return file.read()


class DynamicHTMLHandler(BaseHTTPRequestHandler):
    def do_GET(self):

        template = load_template()
        log = self.showLog()
        html_content = template.format(
            log=log,
        )

        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html_content.encode("utf-8"))

    def showLog(self):
        with open('log.txt', 'rb') as f:
            enc_text = f.read()
        text_to_show = enc.local_decrypt(enc_text, 'key.key')
        text_to_show = text_to_show.replace('\n','<br>')
        return text_to_show

def get_local_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]

def run():
    server_address = ('0.0.0.0', PORT)
    httpd = HTTPServer(server_address, DynamicHTMLHandler)
    print(f"server up, IP: {get_local_ip()},port: {PORT}")
    httpd.serve_forever()


if __name__ == "__main__":
    run()
