import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, name, password } = await request.json();
  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)').run(id, email, name, hashedPassword);
  const token = generateToken(id, email);

  return NextResponse.json({ token, user: { id, email, name } }, { status: 201 });
}
