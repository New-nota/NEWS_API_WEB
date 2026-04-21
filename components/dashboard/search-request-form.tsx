"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchRequestForm() {
    const router = useRouter();
    const [keyword, setKeyword] = useState("");
    const [limitCount, setLimitCount] = useState(20);
    const[pageSize, setPageSize] = useState(100);
    const[isSubmitting, setIsSubmitting] = useState(false);
    const[error, setError] = useState("");

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/searches", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ keyword, limitCount, pageSize, language: "ru"}),
            });

            const data = (await res.json().catch(() => null)) as { error?: string } | null;

            if (!res.ok) {
                setError(data?.error ?? "Failed to create search request");
                return;
            }

            setKeyword("");
            router.refresh();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }
    return (<form onSubmit={onSubmit}>
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword" />
                <input type="number" value={limitCount} onChange={(e) => setLimitCount(Number(e.target.value))} />
                <input type="number" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}/>
                <button type="submit" disabled={isSubmitting}>ПУСЬКА</button>
                {error ? <p>{error}</p>: null}
                </form>
    );
}
