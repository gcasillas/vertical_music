export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch("https://rpc-futurenet.stellar.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "RPC failed" }, { status: 500 })
  }
}