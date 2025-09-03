"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { actEmailVerification, actResendVerificationCode } from "@/store/auth/act/actEmailVerification"

export default function EmailVerificationModal() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [activeIndex, setActiveIndex] = useState(0)
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      // Move to next input if value is entered
      if (value && index < 5) {
        setActiveIndex(index + 1)
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      setActiveIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()

    // Only accept numeric input up to 6 digits
    if (/^[0-9]{1,6}$/.test(pastedData)) {
      const newCode = pastedData.padEnd(6, "").split("")
      setCode(newCode)
      setActiveIndex(Math.min(pastedData.length, 5))
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  const handleVerify = async () => {
    if (!user?.email) {
      toast.error("No email found. Please try again.")
      return
    }

    const verificationData = {
      email: user.email,
      code: code.join(""),
    }

    try {
      const response = await dispatch(actEmailVerification(verificationData)).unwrap()
      toast.success(response.message)
      navigate("/login")
    } catch (error: unknown) {
      toast.error(error.message || "Verification failed")
    }
  }

  const handleResend = async () => {
    if (!user?.email) {
      toast.error("No email found. Please try again.")
      return
    }

    const resendData = {
      email: user.email,
    }

    try {
      const response = await dispatch(actResendVerificationCode(resendData)).unwrap()
      toast.success(response.message)
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh] ">
      <div className="relative w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        {/* Email icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <Mail className="text-primary" size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-semibold text-center text-gray-900">Check your email</h1>

        {/* Subtitle */}
        <p className="mb-8 text-center text-gray-500">
          Enter the 6-digit verification code sent to
          <br />
          {user?.email}
        </p>

        {/* Verification code inputs */}
        <div className="flex justify-center gap-3 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(e)}
              onFocus={() => setActiveIndex(index)}
              ref={(el) => (inputRefs.current[index] = el)}
              className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none transition-colors ${
                activeIndex === index
                  ? "border-primary bg-purple-50"
                  : digit
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-200 bg-white"
              }`}
              maxLength={1}
            />
          ))}
        </div>

        {/* Resend code link */}
        <p className="mb-8 text-center text-gray-500">
          {"Didn't get your code? "}
          <button
            onClick={handleResend}
            className="font-medium text-blue-600 hover:text-primary"
          >
            Send a new code
          </button>
        </p>

        {/* Verify button */}
        <Button
          onClick={handleVerify}
          className="w-full py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          disabled={code.some((digit) => !digit)}
        >
          Verify email
        </Button>
      </div>
    </div>
  )
}