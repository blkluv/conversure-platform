import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import Papa from "papaparse"

interface ColumnMapping {
  name?: string
  phone?: string
  email?: string
  language?: string
  tags?: string
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { fileContent, fileName, columnMapping } = body as {
      fileContent: string
      fileName: string
      columnMapping: ColumnMapping
    }

    if (!fileContent || !columnMapping || !columnMapping.phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      })
    })

    const rows = parseResult.data

    const contactsToCreate = rows
      .map((row) => {
        const phone = row[columnMapping.phone!]?.trim()
        if (!phone) return null

        const name = columnMapping.name ? row[columnMapping.name]?.trim() : undefined
        const email = columnMapping.email ? row[columnMapping.email]?.trim() : undefined
        const language = columnMapping.language ? row[columnMapping.language]?.trim() : undefined

        let tags: string[] = []
        if (columnMapping.tags && row[columnMapping.tags]) {
          tags = row[columnMapping.tags]
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean)
        }

        return {
          companyId: session.companyId,
          phone,
          name,
          email,
          language,
          tags,
        }
      })
      .filter(Boolean)

    const uniqueContacts = contactsToCreate.reduce((acc, contact) => {
      const key = `${contact!.phone}`
      if (!acc.has(key)) {
        acc.set(key, contact!)
      }
      return acc
    }, new Map())

    const contactsArray = Array.from(uniqueContacts.values())

    const created = await db.$transaction(async (tx) => {
      const results = []

      for (const contact of contactsArray) {
        const existing = await tx.contact.findUnique({
          where: {
            companyId_phone: {
              companyId: contact.companyId,
              phone: contact.phone,
            },
          },
        })

        if (existing) {
          const updated = await tx.contact.update({
            where: { id: existing.id },
            data: {
              name: contact.name || existing.name,
              email: contact.email || existing.email,
              language: contact.language || existing.language,
              tags: contact.tags.length > 0 ? contact.tags : existing.tags,
            },
          })
          results.push(updated)
        } else {
          const newContact = await tx.contact.create({
            data: contact,
          })
          results.push(newContact)
        }
      }

      await tx.importBatch.create({
        data: {
          companyId: session.companyId,
          type: "contacts",
          fileName,
          rowCount: results.length,
          createdById: session.id,
        },
      })

      return results
    })

    return NextResponse.json({
      success: true,
      imported: created.length,
      contacts: created,
    })
  } catch (error) {
    console.error("[v0] Error importing contacts:", error)
    return NextResponse.json({ error: "Failed to import contacts" }, { status: 500 })
  }
}
