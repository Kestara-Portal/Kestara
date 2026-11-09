import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    // Cek apakah email sudah terdaftar di database
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Enkripsi password sebelum disimpan (wajib)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan data pendaftar ke database MySQL
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'pencari',
      },
    });

    return NextResponse.json({ message: 'Registrasi berhasil', user: newUser }, { status: 201 });
  } catch (error) {
    // Pesan ini akan muncul di Terminal VS Code kamu jika gagal
    console.error("ERROR SAAT REGISTER:", error); 
    
    return NextResponse.json({ message: 'Terjadi kesalahan sistem saat menyimpan ke database' }, { status: 500 });
  }
}