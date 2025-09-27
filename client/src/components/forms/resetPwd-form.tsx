"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Shield, Lock, Check, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { 
  resetForgotPasswordUI,
  updateEmail,
  updateOtp,
  decrementResendWaitTime
} from "@/store/auth/forgotPasswordSlice "
import { toast } from "sonner"
import actForgotPasswordSendOtp from "@/store/auth/act/actForgotPasswordSendOtp"
import actForgotPasswordVerifyOtp from "@/store/auth/act/actForgotPasswordVerifyOtp"
import actForgotPasswordReset from "@/store/auth/act/actForgotPasswordReset"
import { actResendPasswordCode } from "@/store/auth/act/actForgotPasswordResendCode"
import { useNavigate } from "react-router-dom"

type Step = "email" | "verification" | "password" | "success"

interface PasswordStrength {
  score: number
  feedback: string[]
  isValid: boolean
}

// Interface pour le compteur de tentatives
interface AttemptCount {
  email: number;
  verification: number;
  password: number;
  success: number;
}

const ResetPasswordForm = () => {
  const dispatch = useAppDispatch()
  
  const { 
    loading, 
    error, 
    resendLoading,
    resendError,
    resendWaitTime,
    resendSuccess
  } = useAppSelector((state) => state.forgotPassword)
  
  const navigate = useNavigate()
  
  // États principaux
  const [currentStep, setCurrentStep] = useState<Step>("email")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // États de validation et sécurité
  const [emailError, setEmailError] = useState("")
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [codeError, setCodeError] = useState("")
  const [attemptCount, setAttemptCount] = useState<AttemptCount>({ 
    email: 0, 
    verification: 0, 
    password: 0, 
    success: 0 
  })
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  
  // États de soumission pour éviter les doubles clics
  const [isSubmitting, setIsSubmitting] = useState(false)

  const MAX_ATTEMPTS = 3
  const LOCK_DURATION = 3000 // 50 minutes en secondes

  const steps = [
    { id: "email", title: "Email", icon: Mail },
    { id: "verification", title: "Vérification", icon: Shield },
    { id: "password", title: "Mot de passe", icon: Lock },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  // Validation email
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const isValid = emailRegex.test(email.trim())
    
    if (!email.trim()) {
      setEmailError("L'adresse email est requise")
      return false
    }
    
    if (!isValid) {
      setEmailError("Format d'email invalide")
      return false
    }
    
    if (email.length > 254) {
      setEmailError("L'adresse email est trop longue")
      return false
    }
    
    setEmailError("")
    return true
  }, [])

  // Validation de mot de passe
  const validatePassword = useCallback((pwd: string): PasswordStrength => {
    const errors: string[] = []
    let score = 0

    if (pwd.length < 8) {
      errors.push("Au moins 8 caractères")
    } else if (pwd.length >= 12) {
      score += 2
    } else {
      score += 1
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push("Au moins 1 caractère spécial")
    } else {
      score += 1
    }

    if (!/\d/.test(pwd)) {
      errors.push("Au moins 1 chiffre")
    } else {
      score += 1
    }

    if (!/[a-z]/.test(pwd)) {
      errors.push("Au moins 1 lettre minuscule")
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push("Au moins 1 lettre majuscule")
    } else {
      score += 1
    }

    const weakPatterns = [
      /(.)\1{2,}/,
      /123|abc|qwerty|password/i,
    ]
    
    if (weakPatterns.some(pattern => pattern.test(pwd))) {
      errors.push("Évitez les motifs prévisibles")
      score = Math.max(0, score - 2)
    }

    return {
      score,
      feedback: errors,
      isValid: errors.length === 0 && score >= 4
    }
  }, [])

  // Validation du code
  const validateVerificationCode = useCallback((code: string): boolean => {
    if (code.length !== 6) {
      setCodeError("Le code doit contenir exactement 6 chiffres")
      toast.error("Le code doit contenir exactement 6 chiffres")
      return false
    }
    
    if (!/^\d{6}$/.test(code)) {
      setCodeError("Le code ne doit contenir que des chiffres")
      toast.error("Le code ne doit contenir que des chiffres")
      return false
    }
    
    setCodeError("")
    return true
  }, [])

  // CORRECTION : Gestion des tentatives échouées
  const handleFailedAttempt = useCallback((step: Step) => {
    setAttemptCount(prev => {
      // Correction des lignes problématiques
      const newCount = { ...prev, [step]: (prev as any)[step] + 1 }
      
      if ((newCount as any)[step] >= MAX_ATTEMPTS) {
        setIsLocked(true)
        setLockTimer(LOCK_DURATION)
        toast.error(`Trop de tentatives échouées. Verrouillage pendant ${LOCK_DURATION / 60} minutes.`)
      }
      
      return newCount
    })
  }, [MAX_ATTEMPTS, LOCK_DURATION])

  const resetAttempts = useCallback((step: Step) => {
    setAttemptCount(prev => ({ ...prev, [step]: 0 }))
  }, [])

  // Timer pour le verrouillage
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false)
            setAttemptCount({ email: 0, verification: 0, password: 0, success: 0 })
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lockTimer])

  // Timer pour le renvoi de code
  useEffect(() => {
    if (resendWaitTime > 0) {
      const timer = setInterval(() => {
        dispatch(decrementResendWaitTime())
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [resendWaitTime, dispatch])

  // Gestion des erreurs uniquement
  useEffect(() => {
    if (error && !isSubmitting) {
      console.log('Error occurred:', error, 'Current step:', currentStep)
      toast.error(error)
      handleFailedAttempt(currentStep)
    }
    if (resendError) {
      toast.error(resendError)
    }
  }, [error, resendError, currentStep, handleFailedAttempt, isSubmitting])

  // Gestion du succès du renvoi de code
  useEffect(() => {
    if (resendSuccess) {
      toast.success("Nouveau code envoyé avec succès")
    }
  }, [resendSuccess])

  const passwordStrength = useMemo(() => {
    return password ? validatePassword(password) : { score: 0, feedback: [], isValid: false }
  }, [password, validatePassword])

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas")
    } else {
      setConfirmPasswordError("")
    }
  }, [password, confirmPassword])

  // Handlers avec gestion directe des transitions
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked || isSubmitting) {
      if (isLocked) {
        toast.error(`Compte verrouillé. Réessayez dans ${Math.ceil(lockTimer / 60)} minutes.`)
      }
      return
    }
    
    if (!validateEmail(email)) return

    setIsSubmitting(true)
    
    try {
      console.log('Sending OTP for email:', email.trim().toLowerCase())
      const result = await dispatch(actForgotPasswordSendOtp(email.trim().toLowerCase()))
      
      if (actForgotPasswordSendOtp.fulfilled.match(result)) {
        console.log('OTP sent successfully, moving to verification step')
        resetAttempts("email")
        setCurrentStep("verification")
        toast.success("Code de vérification envoyé avec succès")
      } else if (actForgotPasswordSendOtp.rejected.match(result)) {
        console.log('OTP sending failed:', result.error)
      }
    } catch (error) {
      console.error("Erreur inattendue lors de l'envoi OTP:", error)
      toast.error("Une erreur inattendue s'est produite")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked || isSubmitting) {
      if (isLocked) {
        toast.error(`Compte verrouillé. Réessayez dans ${Math.ceil(lockTimer / 60)} minutes.`)
      }
      return
    }

    const code = verificationCode.join("")
    if (!validateVerificationCode(code)) return

    setIsSubmitting(true)

    try {
      console.log('Verifying OTP:', { email: email.trim().toLowerCase(), code })
      const result = await dispatch(actForgotPasswordVerifyOtp({ 
        email: email.trim().toLowerCase(), 
        code 
      }))
      
      if (actForgotPasswordVerifyOtp.fulfilled.match(result)) {
        console.log('OTP verified successfully, moving to password step')
        resetAttempts("verification")
        setCurrentStep("password")
        toast.success("Code vérifié avec succès")
      } else if (actForgotPasswordVerifyOtp.rejected.match(result)) {
        console.log('OTP verification failed:', result.error)
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la vérification OTP:", error)
      toast.error("Une erreur inattendue s'est produite")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked || isSubmitting) {
      if (isLocked) {
        toast.error(`Compte verrouillé. Réessayez dans ${Math.ceil(lockTimer / 60)} minutes.`)
      }
      return
    }
    
    if (!passwordStrength.isValid) {
      setPasswordErrors(passwordStrength.feedback)
      toast.error("Veuillez corriger les erreurs du mot de passe")
      return
    }
    
    if (confirmPasswordError) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Resetting password for email:', email.trim().toLowerCase())
      const result = await dispatch(actForgotPasswordReset({ 
        email: email.trim().toLowerCase(), 
        password,
        password_confirmation: confirmPassword
      }))
      
      if (actForgotPasswordReset.fulfilled.match(result)) {
        console.log('Password reset successfully, moving to success step')
        resetAttempts("password")
        setCurrentStep("success")
        toast.success("Mot de passe réinitialisé avec succès")
      } else if (actForgotPasswordReset.rejected.match(result)) {
        console.log('Password reset failed:', result.error)
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la réinitialisation:", error)
      toast.error("Une erreur inattendue s'est produite")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    if (resendWaitTime > 0) {
      toast.error(`Veuillez attendre ${resendWaitTime} secondes avant de renvoyer`)
      return
    }

    if (!email) {
      toast.error("Aucune adresse email spécifiée")
      return
    }

    const result = await dispatch(actResendPasswordCode({ email: email.trim().toLowerCase() }))
    if (actResendPasswordCode.rejected.match(result)) {
      return
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    if (value.length <= 1) {
      const newCode = [...verificationCode]
      newCode[index] = value
      setVerificationCode(newCode)
      setCodeError("")

      dispatch(updateOtp(newCode.join("")))

      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const goBack = () => {
    dispatch(resetForgotPasswordUI())
    setCodeError("")
    setPasswordErrors([])
    setConfirmPasswordError("")
    setIsSubmitting(false)
    
    if (currentStep === "verification") {
      setCurrentStep("email")
      setVerificationCode(["", "", "", "", "", ""])
    }
    if (currentStep === "password") {
      setCurrentStep("verification")
      setPassword("")
      setConfirmPassword("")
    }
  }

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return "text-red-500"
    if (score <= 4) return "text-yellow-500"
    return "text-green-500"
  }

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return "Faible"
    if (score <= 4) return "Moyen"
    return "Fort"
  }

  if (currentStep === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Mot de passe réinitialisé !</h2>
                <p className="mt-2 text-muted-foreground">
                  Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre
                  nouveau mot de passe.
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => navigate("/login")}
              >
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Réinitialiser le mot de passe</CardTitle>
            {currentStep !== "email" && (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isLocked && (
            <div className="flex items-center justify-center p-3 border border-red-200 rounded-lg bg-red-50">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              <span className="text-sm text-red-700">
                Compte verrouillé pendant {Math.ceil(lockTimer / 60)} min {lockTimer % 60} sec
              </span>
            </div>
          )}

          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }
                  `}
                  >
                    {isCompleted ? <Check className="w-8 h-8" /> : <Icon className="w-6 h-6" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-10 h-1 mx-2 ${isCompleted ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              )
            })}
          </div>

          {attemptCount[currentStep] > 0 && !isLocked && (
            <div className="text-sm text-center text-orange-600">
              Tentative {attemptCount[currentStep]}/{MAX_ATTEMPTS}
            </div>
          )}
          
        </CardHeader>

        <CardContent className="space-y-4">
          {currentStep === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <CardDescription>Entrez votre adresse email pour recevoir un code de vérification.</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    dispatch(updateEmail(e.target.value))
                    setEmailError("")
                  }}
                  className={emailError ? "border-red-500" : ""}
                  required
                  disabled={isLocked || isSubmitting}
                  autoComplete="email"
                />
                {emailError && (
                  <p className="flex items-center text-sm text-red-500">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {emailError}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading === "pending" || isLocked || !email.trim() || isSubmitting}
              >
                {loading === "pending" || isSubmitting ? "Envoi en cours..." : "Envoyer le code"}
              </Button>
            </form>
          )}

          {currentStep === "verification" && (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <CardDescription>Entrez le code de vérification à 6 chiffres envoyé à {email}.</CardDescription>
              <div className="space-y-2">
                <Label>Code de vérification</Label>
                <div className="flex justify-center space-x-2">
                  {verificationCode.map((digit, index) => (
                    <Input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`text-lg font-semibold text-center h-14 w-14 ${codeError ? "border-red-500" : ""}`}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      disabled={isLocked || isSubmitting}
                      required
                    />
                  ))}
                </div>
                {codeError && (
                  <p className="flex items-center justify-center text-sm text-red-500">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {codeError}
                  </p>
                )}
              </div>
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-secondary"
                  onClick={handleResendCode}
                  disabled={resendLoading === "pending" || resendWaitTime > 0 || isLocked}
                  type="button"
                >
                  {resendLoading === "pending" 
                    ? "Envoi..." 
                    : resendWaitTime > 0 
                      ? `Renvoyer (${resendWaitTime}s)`
                      : "Renvoyer le code"
                  }
                </Button>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading === "pending" || verificationCode.join("").length !== 6 || isLocked || isSubmitting}
              >
                {loading === "pending" || isSubmitting ? "Vérification..." : "Vérifier le code"}
              </Button>
            </form>
          )}

          {currentStep === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <CardDescription>Créez un nouveau mot de passe sécurisé pour votre compte.</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordErrors([])
                    }}
                    className={passwordErrors.length > 0 ? "border-red-500 pr-10" : "pr-10"}
                    required
                    disabled={isLocked || isSubmitting}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Force du mot de passe:</span>
                      <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength.score)}`}>
                        {getPasswordStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? "bg-red-500" :
                          passwordStrength.score <= 4 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {passwordErrors.length > 0 && (
                  <div className="space-y-1 text-sm text-red-500">
                    <p className="flex items-center font-medium">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Critères manquants:
                    </p>
                    <ul className="ml-5 space-y-1 list-disc list-inside">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setConfirmPasswordError("")
                    }}
                    className={confirmPasswordError ? "border-red-500 pr-10" : "pr-10"}
                    required
                    disabled={isLocked || isSubmitting}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {confirmPasswordError && (
                  <p className="flex items-center text-sm text-red-500">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {confirmPasswordError}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading === "pending" || !passwordStrength.isValid || confirmPasswordError !== "" || isLocked || isSubmitting}
              >
                {loading === "pending" || isSubmitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPasswordForm