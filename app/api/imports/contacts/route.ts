import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import Papa from "papaparse"

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileContent = await file.text()

    const parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      })
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV file", details: parseResult.errors[0].message },
        { status: 400 },
      )
    }

    const rows = parseResult.data

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      rowCount: rows.length,
      columns: Object.keys(rows[0]),
      preview: rows.slice(0, 5),
    })
  } catch (error) {
    console.error("[v0] Error processing contact upload:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}
