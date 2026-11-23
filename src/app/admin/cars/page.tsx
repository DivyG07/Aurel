import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { deleteCar } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
import { Notice, PageHead, Table, td } from "../ui";

export default async function AdminCars({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; q?: string }> }) {
  const sp = await searchParams;
  const cars = await db.car.findMany({
    where: sp.q ? { OR: [{ model: { contains: sp.q, mode: "insensitive" } }, { brand: { name: { contains: sp.q, mode: "insensitive" } } }] } : undefined,
    include: { brand: true, _count: { select: { auctions: true, inquiries: true } } },
    orderBy: [{ brand: { name: "asc" } }, { model: "asc" }],
  });
  return (
    <>
      <PageHead title="Listings" sub={`${cars.length} cars in the collection`} action={<Link href="/admin/cars/new" className="btn btn-primary">Add listing</Link>} />
      <Notice saved={sp.saved} error={sp.error} />
      <form className="mb-5 flex gap-3">
        <input name="q" defaultValue={sp.q} placeholder="Search brand or model…" className="field max-w-xs" />
        <button className="btn btn-ghost">Search</button>
      </form>
      <Table head={["", "Car", "Price from", "Status", "Media", "Views", ""]} empty={!cars.length}>
        {cars.map((c) => (
          <tr key={c.id}>
            <td className={`${td} w-24`}>
              <div className="relative h-12 w-20 overflow-hidden bg-graphite">{c.heroImage && <Image src={c.heroImage} alt="" fill sizes="80px" className="object-cover" />}</div>
            </td>
            <td className={td}>
              <p className="text-xs text-gold">{c.brand.name}</p>
              <p>{c.model} <span className="text-mist">· {c.year}</span></p>
              {c.featured && <p className="text-[10px] uppercase tracking-[0.2em] text-mist">Featured</p>}
            </td>
            <td className={td}>{formatPrice(c.priceFrom)}</td>
            <td className={td}>{c.status}</td>
            <td className={`${td} text-xs text-mist`}>
              {c.heroImage ? "Photos" : "No photo"} · {c.sketchfabUid ? "360°" : "No 360°"}
            </td>
            <td className={td}>{c.views}</td>
            <td className={`${td} whitespace-nowrap`}>
              <div className="flex gap-4">
                <Link href={`/cars/${c.slug}`} className="text-xs text-mist hover:text-ivory">View</Link>
                <Link href={`/admin/cars/${c.id}`} className="text-xs text-gold hover:text-gold-soft">Edit</Link>
                <ConfirmButton action={deleteCar} id={c.id} label="Delete" confirm={`Delete ${c.brand.name} ${c.model}? This cannot be undone.`} />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
