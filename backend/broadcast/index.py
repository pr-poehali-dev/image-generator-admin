import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send broadcast messages to all users and retrieve active messages
    Args: event - dict with httpMethod, body (message field for POST)
          context - object with request_id attribute
    Returns: HTTP response with broadcast data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    if method == 'GET':
        cursor.execute(
            "SELECT id, message, created_at FROM broadcast_messages WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
        )
        row = cursor.fetchone()
        
        result = None
        if row:
            result = {
                'id': row[0],
                'message': row[1],
                'createdAt': row[2].isoformat() if row[2] else None
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'message': result})
        }
    
    if method == 'POST':
        headers = event.get('headers', {})
        admin_key = headers.get('x-admin-key', '') or headers.get('X-Admin-Key', '')
        
        if admin_key != 'misha123':
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        body_data = json.loads(event.get('body', '{}'))
        message: str = body_data.get('message', '')
        
        if not message:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message is required'})
            }
        
        cursor.execute("UPDATE broadcast_messages SET is_active = false WHERE is_active = true")
        
        cursor.execute(
            "INSERT INTO broadcast_messages (message, is_active) VALUES (%s, %s) RETURNING id, created_at",
            (message, True)
        )
        row = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'id': row[0],
                'message': message,
                'createdAt': row[1].isoformat() if row[1] else None
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }