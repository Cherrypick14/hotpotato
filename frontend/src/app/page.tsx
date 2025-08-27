"use client"

import { ReactiveDotProvider } from "@reactive-dot/react"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { config } from "@/lib/reactive-dot/config"
import { App } from "./app"

export default function Home() {
  return (
    <div className="flex grow flex-col items-center justify-center py-8">
      <Header />

      <ReactiveDotProvider config={config}>
        <div className="w-full max-w-4xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800">Contract Interaction Interface</h2>
            <p className="text-blue-700">
              This interface allows developers to directly interact with the Hot Potato smart contract functions.
              For a complete gaming experience, visit the <a href="/game" className="underline">Play Game</a> page.
            </p>
          </div>
          <App />
        </div>
      </ReactiveDotProvider>

      <Footer />
    </div>
  )
}
