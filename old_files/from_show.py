import tkinter as tk

def play_form(text):
    window = tk.Tk()
    window.title("Log show")
    greeting = tk.Label(text=text)
    window.geometry("400x300")
    greeting.pack()
    window.mainloop()

if __name__ == '__main__':
    play_form("Hello world")