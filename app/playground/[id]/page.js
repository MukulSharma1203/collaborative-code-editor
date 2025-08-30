"use client"
import { useParams } from "next/navigation"

export default function Playground() {
    const {id} = useParams()
    return (
        <div>Playground {id} </div>
    )
}
