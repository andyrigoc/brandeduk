<?php
/**
 * BrandedUK Authentication API
 * Handles user sign in, sign up, and session management
 * Uses SQLite for simple, file-based database storage
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database path
$dbPath = __DIR__ . '/users.db';

// Initialize database
function initDatabase($dbPath) {
    $db = new SQLite3($dbPath);
    
    // Create users table if not exists
    $db->exec('
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            company TEXT,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    return $db;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['action'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}

$action = $input['action'];

try {
    $db = initDatabase($dbPath);
    
    switch ($action) {
        case 'signup':
            // Validate required fields
            if (empty($input['firstName']) || empty($input['lastName']) || 
                empty($input['email']) || empty($input['password'])) {
                echo json_encode(['success' => false, 'message' => 'All required fields must be filled']);
                exit();
            }
            
            // Check if email exists
            $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
            $stmt->bindValue(':email', $input['email'], SQLITE3_TEXT);
            $result = $stmt->execute();
            
            if ($result->fetchArray()) {
                echo json_encode(['success' => false, 'message' => 'Email already registered']);
                exit();
            }
            
            // Hash password
            $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
            
            // Insert new user
            $stmt = $db->prepare('
                INSERT INTO users (first_name, last_name, email, phone, company, password_hash)
                VALUES (:firstName, :lastName, :email, :phone, :company, :passwordHash)
            ');
            $stmt->bindValue(':firstName', $input['firstName'], SQLITE3_TEXT);
            $stmt->bindValue(':lastName', $input['lastName'], SQLITE3_TEXT);
            $stmt->bindValue(':email', $input['email'], SQLITE3_TEXT);
            $stmt->bindValue(':phone', $input['phone'] ?? '', SQLITE3_TEXT);
            $stmt->bindValue(':company', $input['company'] ?? '', SQLITE3_TEXT);
            $stmt->bindValue(':passwordHash', $passwordHash, SQLITE3_TEXT);
            
            if ($stmt->execute()) {
                $userId = $db->lastInsertRowID();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Account created successfully',
                    'user' => [
                        'id' => $userId,
                        'firstName' => $input['firstName'],
                        'lastName' => $input['lastName'],
                        'email' => $input['email'],
                        'phone' => $input['phone'] ?? '',
                        'company' => $input['company'] ?? ''
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create account']);
            }
            break;
            
        case 'signin':
            // Validate required fields
            if (empty($input['email']) || empty($input['password'])) {
                echo json_encode(['success' => false, 'message' => 'Email and password are required']);
                exit();
            }
            
            // Find user by email
            $stmt = $db->prepare('SELECT * FROM users WHERE email = :email');
            $stmt->bindValue(':email', $input['email'], SQLITE3_TEXT);
            $result = $stmt->execute();
            $user = $result->fetchArray(SQLITE3_ASSOC);
            
            if (!$user) {
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit();
            }
            
            // Verify password
            if (!password_verify($input['password'], $user['password_hash'])) {
                echo json_encode(['success' => false, 'message' => 'Invalid password']);
                exit();
            }
            
            // Return user data (without password)
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'email' => $user['email'],
                    'phone' => $user['phone'],
                    'company' => $user['company']
                ]
            ]);
            break;
            
        case 'getUser':
            // Get user by ID
            if (empty($input['userId'])) {
                echo json_encode(['success' => false, 'message' => 'User ID required']);
                exit();
            }
            
            $stmt = $db->prepare('SELECT * FROM users WHERE id = :id');
            $stmt->bindValue(':id', $input['userId'], SQLITE3_INTEGER);
            $result = $stmt->execute();
            $user = $result->fetchArray(SQLITE3_ASSOC);
            
            if ($user) {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'firstName' => $user['first_name'],
                        'lastName' => $user['last_name'],
                        'email' => $user['email'],
                        'phone' => $user['phone'],
                        'company' => $user['company']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
            break;
            
        case 'updateUser':
            // Update user profile
            if (empty($input['userId'])) {
                echo json_encode(['success' => false, 'message' => 'User ID required']);
                exit();
            }
            
            $stmt = $db->prepare('
                UPDATE users SET 
                    first_name = :firstName,
                    last_name = :lastName,
                    phone = :phone,
                    company = :company,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ');
            $stmt->bindValue(':firstName', $input['firstName'], SQLITE3_TEXT);
            $stmt->bindValue(':lastName', $input['lastName'], SQLITE3_TEXT);
            $stmt->bindValue(':phone', $input['phone'] ?? '', SQLITE3_TEXT);
            $stmt->bindValue(':company', $input['company'] ?? '', SQLITE3_TEXT);
            $stmt->bindValue(':id', $input['userId'], SQLITE3_INTEGER);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Profile updated']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
            }
            break;
            
        case 'listUsers':
            // Admin function: list all users
            $result = $db->query('SELECT id, first_name, last_name, email, phone, company, created_at FROM users ORDER BY created_at DESC');
            $users = [];
            
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $users[] = [
                    'id' => $row['id'],
                    'firstName' => $row['first_name'],
                    'lastName' => $row['last_name'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'company' => $row['company'],
                    'createdAt' => $row['created_at']
                ];
            }
            
            echo json_encode(['success' => true, 'users' => $users, 'count' => count($users)]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Unknown action']);
    }
    
    $db->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
