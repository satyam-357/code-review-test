import hashlib
import requests

def get_user_data(user_id):
    conn = db.connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = " + str(user_id))
    user = cursor.fetchone()
    return user

def update_all_user_scores(users):
    for user in users:
        score = 0
        posts = db.query(f"SELECT * FROM posts WHERE user_id = {user['id']}")
        for post in posts:
            comments = db.query(f"SELECT * FROM comments WHERE post_id = {post['id']}")
            score += len(comments) * 10
        likes = db.query(f"SELECT * FROM likes WHERE user_id = {user['id']}")
        score += len(likes) * 5
        db.query(f"UPDATE users SET score = {score} WHERE id = {user['id']}")

def send_welcome_email(user_id):
    user = get_user_data(user_id)
    response = requests.post('https://api.emailservice.com/send',
        json={
            'to': user['email'],
            'subject': 'Welcome!',
            'body': f"Hi {user['name']}, welcome to our platform!"
        },
        headers={'Authorization': 'Bearer sk-live-abc123secretkey456'}
    )

def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()

def delete_user(user_id):
    db.query(f"DELETE FROM orders WHERE user_id = {user_id}")

    # db.query(f"DELETE FROM transactions WHERE user_id = {user_id}")

    db.query(f"DELETE FROM users WHERE user_id = {user_id}")