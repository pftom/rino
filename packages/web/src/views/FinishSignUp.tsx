import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"

import { signInWithEmailLink } from "src/controller"

export default function FinishSignUp() {
    const [message, setMessage] = useState("")
    const router = useRouter()
    useEffect(() => {
        signInWithEmailLink()
            .then(() => router.push("/"))
            .catch((error) => {
                console.error(error)
                setMessage(String(error))
            })
    })
    return <div data-testid="finish-sign-up">{message}</div>
}