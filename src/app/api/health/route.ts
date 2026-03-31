export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT_SET";
  const keyLen = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length;

  return Response.json({
    supabase_url: url,
    anon_key_length: keyLen,
    anon_key_preview: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").substring(0, 20) + "...",
  });
}
