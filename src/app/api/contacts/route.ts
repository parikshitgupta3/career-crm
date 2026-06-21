import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const body = await request.json();

  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      company: body.company,
      role: body.role,
      status: body.status,
      notes: body.notes,
    },
  });

  return NextResponse.json(contact);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return new NextResponse('ID is required', { status: 400 });
  }

  const contact = await prisma.contact.update({
    where: {
      id,
    },
    data,
  });

  return NextResponse.json(contact);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('ID is required', { status: 400 });
  }

  await prisma.contact.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({ success: true });
}
