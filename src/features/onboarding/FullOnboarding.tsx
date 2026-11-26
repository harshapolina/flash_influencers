import { useEffect, useState } from "react";
import { brandSteps, creatorSteps, creators } from "../../data";
import { api, setToken, type PlaceResult, type SocialAccount } from "../../lib/api";
import { requestGoogleIdToken } from "../../lib/googleAuth";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import type { IconName, OnboardingRole } from "../../types";
import { StatusBar } from "../../components/ui/StatusBar";
import { SocialConnect } from "./SocialConnect";

export function FullOnboarding({
  onFinish,
}: {
  onFinish: (role: OnboardingRole) => void | Promise<void>;
}) {
  const { setUser, login, googleLogin } = useAppStore();
  const [phase, setPhase] = useState<"common" | "role" | "login">("common");
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<OnboardingRole>("brand");
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [otpSeconds, setOtpSeconds] = useState(300);
  const [agreed, setAgreed] = useState(true);
  const [introSlide, setIntroSlide] = useState(0);
  const [verifyChannel, setVerifyChannel] = useState<"email" | "phone">("email");
  const steps = role === "brand" ? brandSteps : creatorSteps;
  const current = steps[step];

  const stepTitle = phase === "role" ? steps[step]?.[0] || "" : "";
  const selected = answers[stepTitle] || [];
  const toggle = (value: string) =>
    setAnswers((items) => {
      const current = items[stepTitle] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...items, [stepTitle]: next };
    });
  const setField = (key: string, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    api
      .me()
      .then(({ user }) => {
        const savedAnswers = user.profile?.answers;
        const savedFields = user.profile?.fields;
        if (savedAnswers && typeof savedAnswers === "object") {
          setAnswers(savedAnswers as Record<string, string[]>);
        }
        const nextFields =
          savedFields && typeof savedFields === "object" ? { ...(savedFields as Record<string, string>) } : {};
        if (user.name && !nextFields["Personal Information:LEGAL NAME"]) {
          nextFields["Personal Information:LEGAL NAME"] = user.name;
        }
        if (user.name && !nextFields["Personal Information:DISPLAY NAME"]) {
          nextFields["Personal Information:DISPLAY NAME"] = user.name.split(" ")[0] || user.name;
        }
        setFields(nextFields);
      })
      .catch(() => {});
  }, []);

  const saveProgress = async (nextStep: number) => {
    await api.saveOnboardingProgress({
      phase: "role",
      step: nextStep,
      role,
      answers: {
        ...answers,
        ...(steps[step]?.[0]
          ? { [steps[step][0]]: answers[steps[step][0]] || [] }
          : {}),
      },
      profile: { fields },
    });
  };

  const advanceCommon = () => {
    setError("");
    if (step === 6) {
      setPhase("role");
      setStep(0);
    } else {
      setStep((value) => value + 1);
    }
  };

  const advanceRole = async () => {
    setError("");
    if (step === steps.length - 1) {
      setBusy(true);
      try {
        await onFinish(role);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not finish onboarding");
      } finally {
        setBusy(false);
      }
    } else {
      try {
        await saveProgress(step + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save progress");
        return;
      }
      setStep((value) => value + 1);
    }
  };

  const createAccount = async () => {
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in your name, email, and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { token, user } = await api.register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      setToken(token);
      setUser(user, token);
      await api.saveOnboardingProgress({ phase: "common", step: 4, role });
      advanceCommon();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (phase !== "common" || step !== 5) return;
    const timer = window.setInterval(() => {
      setOtpSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, step]);

  const sendCode = async () => {
    if (verifyChannel === "phone") {
      setError("SMS isn’t connected yet. Choose email and we’ll send a real code to your inbox.");
      return;
    }
    if (!email.trim()) {
      setError("Enter the email on your account before sending a code.");
      return;
    }
    const leavingChoice = step === 4;
    setBusy(true);
    setError("");
    setOtpHint("");
    try {
      const res = await api.sendOtp(email.trim(), "verify");
      if (!res.delivered) {
        setError(res.message || "The code could not be emailed. Try again.");
        return;
      }
      setOtpSeconds(res.expiresInSec || 300);
      setOtp(["", "", "", "", "", ""]);
      setOtpHint(`Code sent to ${email.trim()}. Check your inbox and spam folder.`);
      if (leavingChoice) advanceCommon();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    setError("");
    const code = otp.join("");
    try {
      const res = await api.verifyOtp(email.trim(), code);
      if (res.token && res.user) {
        setToken(res.token);
        setUser(res.user, res.token);
      }
      advanceCommon();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      const idToken = await requestGoogleIdToken();
      const result = await googleLogin(idToken, role);
      if ("needsRole" in result && result.needsRole) {
        setFullName(result.name);
        setEmail(result.email);
        setError("Choose Brand or Creator, then tap Google again.");
        return;
      }
      if (phase === "login") return;
      if (result && "onboardingDone" in result && !result.onboardingDone) {
        setPhase("role");
        setStep(0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = async () => {
    setBusy(true);
    setError("");
    try {
      const user = await login(email.trim(), password, role);
      if (!user) throw new Error("Login succeeded but no user was returned");
      if (user.onboardingDone) return;
      setEmail(user.email || email.trim());
      setFullName(user.name || "");
      setRole(user.role || role);
      if (user.onboardingPhase === "role") {
        setPhase("role");
        setStep(user.onboardingStep || 0);
        return;
      }
      setPhase("common");
      setStep(user.emailVerified ? 6 : Math.max(user.onboardingStep || 4, 4));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid email or password");
    } finally {
      setBusy(false);
    }
  };

  const openLogin = (asRole: OnboardingRole = "brand") => {
    setError("");
    setRole(asRole);
    setEmail("");
    setPassword("");
    setPhase("login");
  };

  const back = () => {
    if (phase === "login") {
      setPhase("common");
      setStep(2);
      return;
    }
    if (step > 0) {
      if (phase === "role") void saveProgress(step - 1).catch(() => {});
      setStep((value) => value - 1);
    }
    else if (phase === "role") {
      setPhase("common");
      setStep(6);
    }
  };

  if (phase === "login") {
    return (
      <CommonShell
        title="Log in"
        subtitle="Choose Brand or Creator, then continue to your dashboard."
        step={1}
        back={back}
      >
        <div className="login-role-toggle" role="tablist" aria-label="Account type">
          <button
            type="button"
            className={role === "brand" ? "active" : ""}
            disabled={busy}
            onClick={() => setRole("brand")}
          >
            Brand
          </button>
          <button
            type="button"
            className={role === "creator" ? "active" : ""}
            disabled={busy}
            onClick={() => setRole("creator")}
          >
            Creator
          </button>
        </div>
        <div className="flow-form">
          <label>
            EMAIL ADDRESS
            <div>
              <Icon name="message" size={17} />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "brand" ? "neha@theloom.in" : "aarohi@orbitly.app"}
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </label>
          <label>
            PASSWORD
            <div>
              <Icon name="shield" size={17} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
        </div>
        {error && <p className="flow-error">{error}</p>}
        <button
          className="flow-primary common-action"
          disabled={busy || !email || !password}
          onClick={submitLogin}
        >
          {busy ? "Logging in…" : `Log in as ${role === "brand" ? "Brand" : "Creator"}`}{" "}
          <Icon name="arrow" size={17} />
        </button>
        <div className="social-divider">
          <span>or continue with</span>
        </div>
        <div className="social-buttons">
          <button type="button" disabled={busy} onClick={continueWithGoogle}>
            <span className="social-google-mark" aria-hidden>
              G
            </span>
            Google
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              setError("Apple Sign-In needs an Apple Developer account. Use Google or email for now.")
            }
          >
            <span className="social-apple-mark" aria-hidden>
              ⌘
            </span>
            Apple
          </button>
        </div>
      </CommonShell>
    );
  }

  if (phase === "common") {
    if (step === 0) {
      return (
        <div className="flow-screen splash-flow">
          <StatusBar />
          <div className="splash-orbit">
            <div className="orbit-ring ring-a" />
            <div className="orbit-ring ring-b" />
            <span className="splash-logo">
              <i />
              <i />
              <i />
            </span>
            <span className="orbit-dot dot-a" />
            <span className="orbit-dot dot-b" />
          </div>
          <div className="splash-name">Orbitly</div>
          <p>Creator-powered distribution</p>
          <button className="invisible-next" aria-label="Continue" onClick={advanceCommon} />
          <small>Tap anywhere to continue</small>
        </div>
      );
    }
    if (step === 1) {
      const slides = [
        {
          title: (
            <>
              Turn influence into <em>real growth.</em>
            </>
          ),
          body: "One trusted platform for brands and creators to find each other, work together, and measure what matters.",
          chip: "96% match",
          icon: "sparkles" as const,
          photos: [0, 1, 2],
        },
        {
          title: (
            <>
              Collaborate without <em>the chaos.</em>
            </>
          ),
          body: "Briefs, bookings, and messages stay in one thread, so every partnership has a clear next step.",
          chip: "Brief ready",
          icon: "message" as const,
          photos: [1, 2, 0],
        },
        {
          title: (
            <>
              Measure what <em>actually matters.</em>
            </>
          ),
          body: "Reach, spend, and payouts come from live campaigns, not a slide you have to update by hand.",
          chip: "+18% reach",
          icon: "trending" as const,
          photos: [2, 0, 1],
        },
      ];
      const slide = slides[introSlide];
      return (
        <div className="flow-screen intro-flow">
          <StatusBar />
          <button className="flow-skip" onClick={() => setStep(2)}>
            Skip
          </button>
          <div className={`intro-images slide-${introSlide}`} key={introSlide}>
            {slide.photos.map((photo, index) => (
              <img key={`${introSlide}-${index}`} src={creators[photo].image} alt={creators[photo].name} />
            ))}
            <span>
              <Icon name={slide.icon} size={14} />
              {slide.chip}
            </span>
          </div>
          <div className="intro-copy">
            <span className="flow-kicker intro-kicker">
              {["DISCOVER", "COLLABORATE", "GROW"].map((word, index) => (
                <b className={index === introSlide ? "on" : ""} key={word}>
                  {word}
                  {index < 2 ? " · " : ""}
                </b>
              ))}
            </span>
            <h1>{slide.title}</h1>
            <p>{slide.body}</p>
            <div className="flow-dots">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === introSlide ? "active" : ""}
                  aria-label={`Intro ${index + 1}`}
                  onClick={() => setIntroSlide(index)}
                />
              ))}
            </div>
            <button
              className="flow-primary"
              onClick={() => {
                if (introSlide < slides.length - 1) setIntroSlide(introSlide + 1);
                else advanceCommon();
              }}
            >
              Continue <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
      );
    }
    if (step === 2) {
      return (
        <CommonShell
          title="Choose your path"
          subtitle="Select the account that best describes how you’ll use Orbitly."
          step={step}
          back={back}
        >
          <div className="role-cards">
            <button className={role === "brand" ? "active" : ""} onClick={() => setRole("brand")}>
              <span className="role-art brand">
                <Icon name="briefcase" size={29} />
                <i />
              </span>
              <span>
                <strong>Brand or business</strong>
                <small>Find creators, run campaigns, and grow your reach.</small>
              </span>
              <i className="flow-radio" />
            </button>
            <button
              className={role === "creator" ? "active" : ""}
              onClick={() => setRole("creator")}
            >
              <span className="role-art creator">
                <Icon name="camera" size={29} />
                <i />
              </span>
              <span>
                <strong>Creator or influencer</strong>
                <small>Find opportunities, build partnerships, and get paid.</small>
              </span>
              <i className="flow-radio" />
            </button>
          </div>
          <button className="flow-primary common-action" onClick={advanceCommon}>
            Continue as {role === "brand" ? "brand" : "creator"} <Icon name="arrow" size={17} />
          </button>
          <div className="intro-links path-login">
            <button className="flow-login" type="button" disabled={busy} onClick={() => openLogin(role)}>
              Already have an account? <b>Log in</b>
            </button>
            <div className="intro-demo-row">
              <button type="button" className="flow-skip" disabled={busy} onClick={() => openLogin("brand")}>
                Brand login
              </button>
              <button type="button" className="flow-skip" disabled={busy} onClick={() => openLogin("creator")}>
                Creator login
              </button>
            </div>
          </div>
        </CommonShell>
      );
    }
    if (step === 3) {
      return (
        <CommonShell
          title="Create your account"
          subtitle={`Join Orbitly as a ${role === "brand" ? "brand" : "creator"}. It only takes a minute.`}
          step={step}
          back={back}
        >
          <div className="flow-form">
            <label>
              FULL NAME
              <div>
                <Icon name="user" size={17} />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </label>
            <label>
              EMAIL ADDRESS
              <div>
                <Icon name="message" size={17} />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
            </label>
            <label>
              PASSWORD
              <div>
                <Icon name="shield" size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <i>
                <Icon name="check" size={10} />
              </i>
              <span>
                I agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>.
              </span>
            </label>
          </div>
          {error && <p className="flow-error">{error}</p>}
          <button className="flow-primary common-action" disabled={busy} onClick={createAccount}>
            {busy ? "Creating…" : "Create account"} <Icon name="arrow" size={17} />
          </button>
          <div className="social-divider">
            <span>or continue with</span>
          </div>
          <div className="social-buttons">
            <button type="button" disabled={busy} onClick={continueWithGoogle}>
              <span className="social-google-mark" aria-hidden>
                G
              </span>
              Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setError("Apple Sign-In needs an Apple Developer account. Use Google or email for now.")
              }
            >
              <span className="social-apple-mark" aria-hidden>
                ⌘
              </span>
              Apple
            </button>
          </div>
          <button className="flow-login" type="button" disabled={busy} onClick={() => openLogin(role)}>
            Already have an account? <b>Log in</b>
          </button>
        </CommonShell>
      );
    }
    if (step === 4) {
      return (
        <CommonShell
          title="Verify your details"
          subtitle="Choose where you’d like us to send your secure verification code."
          step={step}
          back={back}
        >
          <AnimatedVerificationChoice
            email={email}
            channel={verifyChannel}
            onChannel={setVerifyChannel}
          />
          {error && <p className="flow-error">{error}</p>}
          <button className="flow-primary common-action" disabled={busy} onClick={sendCode}>
            {busy ? "Sending…" : "Send verification code"}
          </button>
        </CommonShell>
      );
    }
    if (step === 5) {
      const mins = String(Math.floor(otpSeconds / 60)).padStart(2, "0");
      const secs = String(otpSeconds % 60).padStart(2, "0");
      return (
        <CommonShell
          title="Enter verification code"
          subtitle={`We sent a 6-digit code to ${email}`}
          step={step}
          back={back}
        >
          <div className="otp-row">
            {otp.map((digit, index) => (
              <input
                key={index}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                data-otp={index}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(-1);
                  const next = [...otp];
                  next[index] = value;
                  setOtp(next);
                  if (value && index < 5) {
                    const el = document.querySelector(`input[data-otp="${index + 1}"]`);
                    if (el instanceof HTMLInputElement) el.focus();
                  }
                }}
              />
            ))}
          </div>
          {otpHint && <p className="otp-timer">{otpHint}</p>}
          <p className="otp-timer">
            <Icon name="clock" size={14} /> Code expires in{" "}
            <b>
              {mins}:{secs}
            </b>
          </p>
          {error && <p className="flow-error">{error}</p>}
          <button className="flow-primary common-action" disabled={busy} onClick={verifyCode}>
            {busy ? "Verifying…" : "Verify account"} <Icon name="check" size={17} />
          </button>
          <button className="resend-code" type="button" disabled={busy} onClick={sendCode}>
            Didn’t receive it? <b>Resend code</b>
          </button>
        </CommonShell>
      );
    }
    return <AnimatedAccountSuccess role={role} onContinue={advanceCommon} />;
  }

  if (!current) {
    return (
      <div className="flow-screen">
        <StatusBar />
        <p className="flow-error">Onboarding step is out of range. Go back and try again.</p>
        <button className="flow-primary" type="button" onClick={() => setStep(0)}>
          Restart step
        </button>
      </div>
    );
  }

  if (step === steps.length - 1) {
    return (
      <div className="flow-screen role-complete">
        <StatusBar />
        <div className="complete-visual">
          <span className="complete-icon">
            <Icon name={role === "brand" ? "briefcase" : "user"} size={32} />
          </span>
          {creators.slice(0, 3).map((creator, index) => (
            <img
              className={`complete-face cf-${index}`}
              key={creator.id}
              src={creator.image}
              alt=""
            />
          ))}
          <i className="complete-ring" />
        </div>
        <span className="flow-kicker">ONBOARDING COMPLETE</span>
        <h1>
          {role === "brand" ? "Your brand is ready to grow." : "Your creator profile is live."}
        </h1>
        <p>{current[1]}</p>
        <div className="complete-stats">
          <div>
            <strong>{role === "brand" ? "24" : "12"}</strong>
            <span>{role === "brand" ? "Creator matches" : "Brand matches"}</span>
          </div>
          <div>
            <strong>{role === "brand" ? "8" : "18"}</strong>
            <span>Live opportunities</span>
          </div>
          <div>
            <strong>92%</strong>
            <span>Profile strength</span>
          </div>
        </div>
        {error && <p className="flow-error">{error}</p>}
        <button
          className="flow-primary complete-action"
          disabled={busy}
          onClick={() => advanceRole()}
        >
          Go to {role === "brand" ? "Brand" : "Creator"} Dashboard <Icon name="arrow" size={17} />
        </button>
      </div>
    );
  }

  const isAI =
    current[0] === "AI Business Analysis" || current[0] === "AI Creator Profile Analysis";
  const isReview = current[0] === "Review Your Profile";
  return (
    <div className="flow-screen role-flow">
      <StatusBar />
      <header className="role-header">
        <button onClick={back}>‹</button>
        <div>
          <span>{role === "brand" ? "BRAND" : "CREATOR"} ONBOARDING</span>
          <div>
            <i style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
        <strong>
          {step + 1}
          <small>/{steps.length}</small>
        </strong>
      </header>
      <main className="role-content">
        <span className="role-step">
          STEP {step + 1} OF {steps.length}
        </span>
        <h1>{current[0]}</h1>
        <p>{current[1]}</p>
        {step === 0 ? (
          <RoleWelcome role={role} />
        ) : isAI ? (
          <AIAnalysis role={role} />
        ) : isReview ? (
          <ReviewProfile />
        ) : (
          <OnboardingFields
            role={role}
            title={current[0]}
            selected={selected}
            toggle={toggle}
            fields={fields}
            setField={setField}
            onSkipFace={advanceRole}
          />
        )}
      </main>
      <div className="role-footer">
        {error && <p className="flow-error">{error}</p>}
        <button className="flow-primary" onClick={advanceRole}>
          {step === 0
            ? "Let’s begin"
            : isAI
              ? "View my analysis"
              : isReview
                ? "Submit profile"
                : "Save & continue"}{" "}
          <Icon name="arrow" size={17} />
        </button>
        <span>Saved automatically</span>
      </div>
    </div>
  );
}

function AnimatedAccountSuccess({
  role,
  onContinue,
}: {
  role: OnboardingRole;
  onContinue: () => void;
}) {
  return (
    <div className={`flow-screen animated-account-success ${role}`}>
      <StatusBar />
      <div className="account-success-scene">
        <div className="success-glow glow-lime" />
        <div className="success-glow glow-purple" />
        <div className="account-orbit orbit-success-one" />
        <div className="account-orbit orbit-success-two" />
        <svg className="success-orbit-path" viewBox="0 0 430 330" aria-hidden>
          <path d="M62 166c38-112 248-142 307 1S177 350 62 166Z" />
        </svg>

        <div className="success-check-card">
          <span>
            <Icon name="check" size={31} />
          </span>
          <i className="check-shine" />
        </div>

        <div className="success-role-orb">
          <Icon name={role === "brand" ? "briefcase" : "camera"} size={18} />
        </div>
        <div className="success-shield-orb">
          <Icon name="shield" size={17} />
        </div>

        {Array.from({ length: 9 }).map((_, index) => (
          <i className={`success-particle particle-${index + 1}`} key={index} />
        ))}

        <span className="success-float-label label-secure">
          <Icon name="shield" size={11} /> Account secured
        </span>
        <span className="success-float-label label-ready">
          <i /> Ready to grow
        </span>
      </div>

      <div className="success-copy-block">
        <span className="flow-kicker">ACCOUNT CREATED</span>
        <h1>
          You’re in.
          <br />
          <em>Let’s build your impact.</em>
        </h1>
        <p>
          Your account is verified and secure. Next, we’ll personalise your{" "}
          {role === "brand" ? "brand workspace" : "creator profile"}.
        </p>
      </div>

      <div className="account-pass">
        <div className="account-pass-avatar">
          <strong>NK</strong>
          <i />
        </div>
        <div className="account-pass-copy">
          <span>WELCOME TO ORBITLY</span>
          <strong>Neha Kapoor</strong>
          <small>
            {role === "brand" ? "Brand account · The Loom" : "Creator account · @neha.creates"}
          </small>
        </div>
        <div className="verified-seal">
          <Icon name="shield" size={14} />
          <span>VERIFIED</span>
        </div>
      </div>

      <div className="account-ready-steps">
        <div>
          <span>
            <Icon name="check" size={11} />
          </span>
          <p>
            <strong>Identity confirmed</strong>
            <small>Secure account access enabled</small>
          </p>
        </div>
        <div>
          <span>
            <Icon name="sparkles" size={11} />
          </span>
          <p>
            <strong>Personalisation next</strong>
            <small>Usually takes about 5 minutes</small>
          </p>
        </div>
      </div>

      <button className="flow-primary animated-success-action" onClick={onContinue}>
        Personalise my {role === "brand" ? "workspace" : "profile"} <Icon name="arrow" size={17} />
      </button>
    </div>
  );
}

function maskEmail(value: string) {
  const [name, domain] = value.trim().split("@");
  if (!name || !domain) return "Add your email";
  return `${name.slice(0, 1)}•••@${domain}`;
}

function AnimatedVerificationChoice({
  email,
  channel,
  onChannel,
}: {
  email: string;
  channel: "email" | "phone";
  onChannel: (channel: "email" | "phone") => void;
}) {

  return (
    <div className={`animated-verification ${channel}`}>
      <div className="verification-stage">
        <div className="secure-orbit orbit-one" />
        <div className="secure-orbit orbit-two" />
        <div className="secure-orbit orbit-three" />
        <svg className="secure-paths" viewBox="0 0 380 220" aria-hidden>
          <path className="email-path" d="M56 62c63 8 65 50 134 50" />
          <path className="phone-path" d="M324 161c-64-7-65-49-134-49" />
        </svg>

        <div className="secure-core">
          <span>
            <Icon name="shield" size={29} />
          </span>
          <i className="core-scan" />
        </div>

        <button
          className={`channel-orb email-orb ${channel === "email" ? "active" : ""}`}
          onClick={() => onChannel("email")}
        >
          <span>
            <Icon name="message" size={19} />
          </span>
          <i>
            <Icon name="check" size={8} />
          </i>
        </button>
        <button
          className={`channel-orb phone-orb ${channel === "phone" ? "active" : ""}`}
          onClick={() => onChannel("phone")}
        >
          <span>
            <Icon name="user" size={19} />
          </span>
          <i>
            <Icon name="check" size={8} />
          </i>
        </button>

        <span className="secure-packet packet-one" />
        <span className="secure-packet packet-two" />
        <div className="encryption-badge">
          <i /> END-TO-END ENCRYPTED
        </div>
      </div>

      <div className="verification-channels">
        <button className={channel === "email" ? "active" : ""} onClick={() => onChannel("email")}>
          <span className="channel-icon">
            <Icon name="message" size={19} />
          </span>
          <p>
            <small>RECOMMENDED</small>
            <strong>Email address</strong>
            <em>{maskEmail(email)}</em>
          </p>
          <div className="delivery-time">
            <span>Instant</span>
            <i className="verification-radio" />
          </div>
        </button>
        <button className={channel === "phone" ? "active" : ""} onClick={() => onChannel("phone")}>
          <span className="channel-icon phone">
            <Icon name="user" size={19} />
          </span>
          <p>
            <small>SMS CODE</small>
            <strong>Phone number</strong>
            <em>Not added</em>
          </p>
          <div className="delivery-time">
            <span>~10 sec</span>
            <i className="verification-radio" />
          </div>
        </button>
      </div>

      <div className="verification-feedback">
        <span>
          <Icon name="check" size={12} />
        </span>
        <p>
          <strong>{channel === "email" ? "Email selected" : "SMS selected"}</strong>
          <small>Your one-time code will expire after 5 minutes.</small>
        </p>
        <div className="feedback-bars">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

function CommonShell({
  title,
  subtitle,
  step,
  back,
  children,
}: {
  title: string;
  subtitle: string;
  step: number;
  back: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flow-screen common-flow">
      <StatusBar />
      <header>
        <button onClick={back}>‹</button>
        <div>
          {[2, 3, 4, 5].map((value) => (
            <i className={step >= value ? "active" : ""} key={value} />
          ))}
        </div>
        <span>{step - 1}/4</span>
      </header>
      <main>
        <span className="flow-kicker">GETTING STARTED</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </main>
    </div>
  );
}

function RoleWelcome({ role }: { role: OnboardingRole }) {
  const creatorMode = role === "creator";
  return (
    <div className={`animated-role-welcome ${role}`}>
      <div className="role-preview-stage">
        <div className="role-aurora aurora-one" />
        <div className="role-aurora aurora-two" />
        <svg className="role-orbit-paths" viewBox="0 0 390 285" aria-hidden>
          <ellipse cx="195" cy="137" rx="137" ry="92" />
          <path d="M44 190c77-105 230-114 304-21" />
        </svg>

        <div className="role-main-card">
          {creatorMode ? (
            <>
              <img src={creators[0].image} alt="Creator profile preview" />
              <div className="role-card-shade" />
              <span className="role-availability">
                <i /> Available
              </span>
              <div className="role-card-copy">
                <strong>
                  Aarohi Mehta{" "}
                  <b>
                    <Icon name="check" size={7} />
                  </b>
                </strong>
                <small>Fashion · Beauty · Mumbai</small>
              </div>
            </>
          ) : (
            <div className="brand-preview-card">
              <span>THE LOOM</span>
              <strong>
                Summer
                <br />
                in colour.
              </strong>
              <i />
              <b>Creator campaign</b>
            </div>
          )}
        </div>

        <div className="opportunity-card">
          <span className="opportunity-brand">{creatorMode ? "NB" : "AM"}</span>
          <p>
            <small>{creatorMode ? "NEW BRAND MATCH" : "TOP CREATOR MATCH"}</small>
            <strong>{creatorMode ? "Nura Beauty" : "Aarohi Mehta"}</strong>
            <em>{creatorMode ? "₹24K · 96% fit" : "5.8% engagement"}</em>
          </p>
          <i>
            <Icon name="sparkles" size={11} />
          </i>
        </div>

        <div className="welcome-metric-card">
          <Icon name="trending" size={15} />
          <p>
            <strong>{creatorMode ? "182K" : "2.8M"}</strong>
            <small>{creatorMode ? "Avg. views" : "Campaign reach"}</small>
          </p>
          <span>+18%</span>
        </div>

        <div className="welcome-avatar-stack">
          {creators.slice(1, 4).map((creator) => (
            <img key={creator.id} src={creator.image} alt="" />
          ))}
          <strong>+24</strong>
        </div>

        <span className="welcome-trust-chip">
          <Icon name="shield" size={12} /> Verified network
        </span>
        <span className="welcome-ai-chip">
          <i /> AI matching live
        </span>
      </div>

      <div className="role-benefit-strip">
        <div>
          <span>
            <Icon name={creatorMode ? "briefcase" : "search"} size={16} />
          </span>
          <strong>{creatorMode ? "Paid work" : "Find talent"}</strong>
          <small>{creatorMode ? "Matched to you" : "AI-powered"}</small>
        </div>
        <div>
          <span>
            <Icon name="message" size={16} />
          </span>
          <strong>One workspace</strong>
          <small>Brief to approval</small>
        </div>
        <div>
          <span>
            <Icon name="wallet" size={16} />
          </span>
          <strong>{creatorMode ? "Fast payouts" : "Clear pricing"}</strong>
          <small>Secure & tracked</small>
        </div>
      </div>

      <div className="role-setup-note">
        <span>
          <Icon name="sparkles" size={16} />
        </span>
        <p>
          <strong>Personalised in about 5 minutes</strong>
          <small>Your answers power better recommendations. Progress saves automatically.</small>
        </p>
        <div className="setup-time-ring">
          <strong>5</strong>
          <small>MIN</small>
        </div>
      </div>
    </div>
  );
}

function ChipPicker({
  options,
  selected,
  toggle,
}: {
  options: string[];
  selected: string[];
  toggle: (s: string) => void;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button
          key={option}
          className={selected.includes(option) ? "active" : ""}
          onClick={() => toggle(option)}
        >
          {option}
          {selected.includes(option) && <Icon name="check" size={12} />}
        </button>
      ))}
    </div>
  );
}

function OnboardingFields({
  role,
  title,
  selected,
  toggle,
  fields,
  setField,
  onSkipFace,
}: {
  role: OnboardingRole;
  title: string;
  selected: string[];
  toggle: (s: string) => void;
  fields: Record<string, string>;
  setField: (key: string, value: string) => void;
  onSkipFace: () => void;
}) {
  const pickerMap: Record<string, string[]> = {
    "Marketing Goals": [
      "Brand awareness",
      "Drive sales",
      "Generate leads",
      "Create UGC",
      "Store visits",
      "App installs",
    ],
    "Influencer Categories": [
      "Fashion",
      "Beauty",
      "Technology",
      "Food",
      "Travel",
      "Fitness",
      "Finance",
      "Lifestyle",
    ],
    "Creator Type Preferences": [
      "Nano · 1K–10K",
      "Micro · 10K–100K",
      "Mid-tier · 100K–500K",
      "Macro · 500K+",
    ],
    "Preferred Languages": [
      "English",
      "Hindi",
      "Marathi",
      "Tamil",
      "Telugu",
      "Bengali",
      "Kannada",
      "Gujarati",
    ],
    "Campaign Requirements": [
      "Instagram Reels",
      "Stories",
      "YouTube videos",
      "UGC videos",
      "Product reviews",
      "Store visits",
    ],
    "Collaboration Preferences": [
      "Paid collaboration",
      "Product barter",
      "Affiliate commission",
      "Long-term ambassador",
    ],
    "Creator Category": [
      "Fashion",
      "Beauty",
      "Technology",
      "Food",
      "Travel",
      "Fitness",
      "Finance",
      "Lifestyle",
    ],
    "Content Categories": [
      "Fashion",
      "Beauty",
      "Technology",
      "Food",
      "Travel",
      "Fitness",
      "Wellness",
      "Education",
    ],
    "Content Formats": [
      "Reels",
      "Stories",
      "Posts",
      "YouTube videos",
      "Shorts",
      "UGC videos",
      "Photography",
    ],
    "Preferred Brand Categories": [
      "Fashion",
      "Beauty",
      "Technology",
      "Food & beverage",
      "Travel",
      "Fitness",
      "Finance",
    ],
    "Preferred Platforms": ["Instagram", "YouTube", "Facebook", "LinkedIn", "X / Twitter"],
  };
  if (pickerMap[title])
    return <ChipPicker options={pickerMap[title]} selected={selected} toggle={toggle} />;
  if (title === "Face Verification")
    return <FaceVerification representative={role === "brand"} onSkip={onSkipFace} />;
  if (title === "Social Media Accounts" || title === "Social Account Verification")
    return <SocialConnect />;
  if (title === "Content Portfolio")
    return (
      <div className="upload-zone">
        <Icon name="camera" size={30} />
        <strong>Add your best work</strong>
        <span>Paste a link to a post, reel, or video</span>
        <input
          value={fields[`${title}:LINK`] || ""}
          placeholder="https://"
          onChange={(event) => setField(`${title}:LINK`, event.target.value)}
        />
      </div>
    );
  if (title === "AI Business Analysis" || title === "AI Creator Profile Analysis")
    return <AIAnalysis role={role} />;
  if (
    title === "Marketing Budget" ||
    title === "Number of Creators" ||
    title === "Pricing Preferences"
  )
    return (
      <div className="field-stack">
        <label>
          {title === "Number of Creators" ? "HOW MANY CREATORS" : "STARTING AMOUNT"}
          <input
            value={fields[`${title}:AMOUNT`] || ""}
            placeholder={title === "Number of Creators" ? "8" : "50000"}
            onChange={(event) => setField(`${title}:AMOUNT`, event.target.value)}
          />
        </label>
      </div>
    );
  if (title === "Payment Information")
    return (
      <div className="field-stack">
        <label>
          ACCOUNT HOLDER
          <input
            value={fields[`${title}:ACCOUNT HOLDER`] || ""}
            placeholder="Name on the account"
            onChange={(event) => setField(`${title}:ACCOUNT HOLDER`, event.target.value)}
          />
        </label>
        <label>
          UPI ID
          <input
            value={fields[`${title}:UPI ID`] || ""}
            placeholder="name@upi"
            onChange={(event) => setField(`${title}:UPI ID`, event.target.value)}
          />
        </label>
        <label>
          PAN NUMBER
          <input
            value={fields[`${title}:PAN NUMBER`] || ""}
            placeholder="ABCDE1234F"
            onChange={(event) => setField(`${title}:PAN NUMBER`, event.target.value)}
          />
        </label>
        <div className="secure-inline">
          <Icon name="shield" size={14} /> Encrypted and securely stored
        </div>
      </div>
    );
  if (title === "Target Locations" || title === "Location Details")
    return (
      <AnimatedLocationMap
        creatorMode={role === "creator"}
        selected={selected}
        onSelect={(place) => {
          setField(`${title}:LOCATION`, place);
          if (!selected.includes(place)) toggle(place);
        }}
      />
    );
  if (title === "Audience Information" || title === "Target Audience")
    return (
      <AudienceInformation creatorMode={role === "creator"} selected={selected} toggle={toggle} />
    );
  if (title === "Content Performance")
    return <ContentPerformance fields={fields} setField={setField} />;
  if (title === "Availability") return <AvailabilityScheduler fields={fields} setField={setField} />;
  const fieldHints: Record<string, [string, string][]> = {
    "Business Information": [
      ["COMPANY NAME", "Your company name"],
      ["BUSINESS TYPE", "D2C, agency, store…"],
    ],
    "Business Details": [
      ["WEBSITE", "https://"],
      ["INDUSTRY", "Fashion, food, tech…"],
      ["HEADQUARTERS", "City, country"],
    ],
    "About Your Business": [["COMPANY DESCRIPTION", "What you make and who it is for"]],
    "Products & Services": [
      ["PRIMARY PRODUCTS", "What you sell"],
      ["UNIQUE SELLING POINT", "Why a creator would choose you"],
    ],
    "Personal Information": [
      ["LEGAL NAME", "Your legal name"],
      ["CREATOR USERNAME", "@username"],
      ["DISPLAY NAME", "Name your audience knows"],
    ],
    "Content Performance": [
      ["AVERAGE REEL VIEWS", "182000"],
      ["ENGAGEMENT RATE", "5.8"],
      ["AVERAGE STORY VIEWS", "42000"],
    ],
    "Previous Collaborations": [
      ["BRANDS WORKED WITH", "Brands you have worked with"],
      ["HIGHLIGHT", "A result you can stand behind"],
    ],
  };
  const currentFields = fieldHints[title] || [["ADD INFORMATION", "Type your answer here"]];
  return (
    <div className="field-stack">
      {currentFields.map(([label, hint]) => {
        const key = `${title}:${label}`;
        return (
          <label key={label}>
            {label}
            {title === "About Your Business" ? (
              <textarea
                value={fields[key] || ""}
                placeholder={hint}
                onChange={(event) => setField(key, event.target.value)}
              />
            ) : (
              <input
                value={fields[key] || ""}
                placeholder={hint}
                onChange={(event) => setField(key, event.target.value)}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function AvailabilityScheduler({
  fields,
  setField,
}: {
  fields: Record<string, string>;
  setField: (key: string, value: string) => void;
}) {
  const weekDays = [
    ["M", "Mon"],
    ["T", "Tue"],
    ["W", "Wed"],
    ["T", "Thu"],
    ["F", "Fri"],
    ["S", "Sat"],
    ["S", "Sun"],
  ];
  const savedSchedule = (() => {
    try {
      return fields["Availability:SCHEDULE"] ? JSON.parse(fields["Availability:SCHEDULE"]) : null;
    } catch {
      return null;
    }
  })();
  const [workingDays, setWorkingDays] = useState<number[]>(savedSchedule?.workingDays || [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(savedSchedule?.startTime || "09:00");
  const [endTime, setEndTime] = useState(savedSchedule?.endTime || "18:00");
  const [leadTime, setLeadTime] = useState(savedSchedule?.leadTime || "3 days");
  const [sameDay, setSameDay] = useState(Boolean(savedSchedule?.sameDay));
  useEffect(() => {
    setField(
      "Availability:SCHEDULE",
      JSON.stringify({ workingDays, startTime, endTime, leadTime, sameDay }),
    );
  }, [workingDays, startTime, endTime, leadTime, sameDay]);
  const defaultDates = Array.from({ length: 30 }, (_, index) => index + 1).filter((date) => {
    const day = new Date(2025, 5, date).getDay();
    return day !== 0 && day !== 6;
  });
  const [availableDates, setAvailableDates] = useState(defaultDates);

  const toggleWorkingDay = (day: number) =>
    setWorkingDays((days) =>
      days.includes(day) ? days.filter((item) => item !== day) : [...days, day],
    );
  const toggleDate = (date: number) =>
    setAvailableDates((dates) =>
      dates.includes(date) ? dates.filter((item) => item !== date) : [...dates, date],
    );
  const applyWeekToCalendar = () => {
    setAvailableDates(
      Array.from({ length: 30 }, (_, index) => index + 1).filter((date) =>
        workingDays.includes(new Date(2025, 5, date).getDay() || 7),
      ),
    );
  };

  return (
    <div className="availability-scheduler">
      <section className="availability-status-card">
        <div className="availability-pulse">
          <i />
          <span>
            <Icon name="calendar" size={19} />
          </span>
        </div>
        <p>
          <small>DEFAULT AVAILABILITY</small>
          <strong>{workingDays.length} days per week</strong>
          <em>
            {startTime} – {endTime} · Asia/Kolkata
          </em>
        </p>
        <div className="availability-live">
          <i /> ACTIVE
        </div>
      </section>

      <section className="weekly-schedule">
        <header>
          <div>
            <span>WEEKLY SCHEDULE</span>
            <strong>Choose your working days</strong>
          </div>
          <button onClick={applyWeekToCalendar}>Apply to month</button>
        </header>
        <div className="weekday-picker">
          {weekDays.map(([letter, name], index) => {
            const dayNumber = index + 1;
            return (
              <button
                className={workingDays.includes(dayNumber) ? "active" : ""}
                onClick={() => toggleWorkingDay(dayNumber)}
                key={name}
              >
                <span>{letter}</span>
                <small>{name}</small>
              </button>
            );
          })}
        </div>
        <div className="default-time-row">
          <label>
            <span>START TIME</span>
            <div>
              <Icon name="clock" size={15} />
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
          </label>
          <i className="time-connector" />
          <label>
            <span>END TIME</span>
            <div>
              <Icon name="clock" size={15} />
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </label>
        </div>
        <div className="schedule-summary">
          <Icon name="sparkles" size={14} />
          <span>
            <strong>{workingDays.length * 9} hours available weekly</strong> based on your default
            schedule
          </span>
        </div>
      </section>

      <section className="availability-calendar">
        <header>
          <button aria-label="Previous month">‹</button>
          <div>
            <span>YOUR AVAILABILITY</span>
            <strong>June 2025</strong>
          </div>
          <button aria-label="Next month">›</button>
        </header>
        <div className="calendar-week-labels">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: 30 }, (_, index) => index + 1).map((date) => (
            <button
              className={`${availableDates.includes(date) ? "available" : ""} ${date === 18 ? "today" : ""}`}
              onClick={() => toggleDate(date)}
              key={date}
            >
              <span>{date}</span>
              {availableDates.includes(date) && <i />}
            </button>
          ))}
        </div>
        <footer>
          <div>
            <i className="selected-dot" />
            <span>
              <strong>{availableDates.length} available days</strong>
              <small>Tap a date to change it</small>
            </span>
          </div>
          <button onClick={() => setAvailableDates(defaultDates)}>Reset</button>
        </footer>
      </section>

      <section className="booking-preferences">
        <label>
          <span>
            <Icon name="clock" size={16} />
          </span>
          <p>
            <strong>Minimum booking notice</strong>
            <small>How early should brands book?</small>
          </p>
          <select value={leadTime} onChange={(event) => setLeadTime(event.target.value)}>
            <option>1 day</option>
            <option>3 days</option>
            <option>7 days</option>
            <option>14 days</option>
          </select>
        </label>
        <label>
          <span>
            <Icon name="trending" size={16} />
          </span>
          <p>
            <strong>Same-day bookings</strong>
            <small>Allow urgent collaboration requests</small>
          </p>
          <button
            className={`schedule-toggle ${sameDay ? "on" : ""}`}
            onClick={() => setSameDay(!sameDay)}
          >
            <i />
          </button>
        </label>
      </section>

      <div className="calendar-note">
        <Icon name="shield" size={15} />
        <p>
          <strong>You stay in control</strong>
          <small>Availability helps matching. Every booking still needs your approval.</small>
        </p>
      </div>
    </div>
  );
}

function FaceVerification({
  representative,
  onSkip,
}: {
  representative: boolean;
  onSkip: () => void;
}) {
  const [stage, setStage] = useState<"intro" | "camera" | "processing" | "verified">("intro");
  const startProcessing = () => {
    setStage("processing");
    window.setTimeout(() => setStage("verified"), 1900);
  };

  if (stage === "intro") {
    return (
      <div className="face-verification face-intro">
        <div className="face-trust-visual">
          <div className="face-halo halo-one" />
          <div className="face-halo halo-two" />
          <div className="face-outline">
            <svg viewBox="0 0 100 120" aria-hidden>
              <path d="M23 101c2-19 13-29 27-29s25 10 27 29M31 37c0-20 9-31 19-31s19 11 19 31c0 22-8 36-19 36S31 59 31 37Z" />
              <circle cx="42" cy="39" r="2" />
              <circle cx="58" cy="39" r="2" />
              <path d="M43 55c5 4 9 4 14 0" />
            </svg>
            <i className="face-scan-preview" />
          </div>
          <span className="face-lock">
            <Icon name="shield" size={15} />
          </span>
          <span className="face-live-chip">
            <i /> PRIVATE & SECURE
          </span>
          <span className="face-time-chip">
            <Icon name="clock" size={12} /> Under 30 sec
          </span>
        </div>
        <div className="face-intro-copy">
          <h3>Verify it’s really you</h3>
          <p>
            {representative
              ? "We’ll compare a live selfie with the authorised representative’s identity details."
              : "A quick liveness check protects your identity and gives brands confidence in your profile."}
          </p>
        </div>
        <div className="face-benefits">
          <div>
            <span>
              <Icon name="camera" size={15} />
            </span>
            <p>
              <strong>One live selfie</strong>
              <small>No video is stored</small>
            </p>
          </div>
          <div>
            <span>
              <Icon name="shield" size={15} />
            </span>
            <p>
              <strong>Encrypted processing</strong>
              <small>Deleted after verification</small>
            </p>
          </div>
          <div>
            <span>
              <Icon name="check" size={15} />
            </span>
            <p>
              <strong>Verified badge</strong>
              <small>Build trust instantly</small>
            </p>
          </div>
        </div>
        <button className="face-action" onClick={() => setStage("camera")}>
          <Icon name="camera" size={17} /> Enable camera
        </button>
        <button className="face-back-action" type="button" onClick={onSkip}>
          Skip for now
        </button>
        <small className="face-consent">
          By continuing, you consent to biometric processing for identity verification.
        </small>
      </div>
    );
  }

  if (stage === "camera") {
    return (
      <div className="face-verification face-camera">
        <div className="camera-preview">
          <img src={creators[0].image} alt="Live camera preview" />
          <div className="camera-vignette" />
          <div className="face-guide">
            {Array.from({ length: 10 }).map((_, index) => (
              <i className={`landmark lm-${index + 1}`} key={index} />
            ))}
            <span className="live-scan-line" />
          </div>
          <span className="camera-status">
            <i /> CAMERA LIVE
          </span>
          <span className="camera-secure">
            <Icon name="shield" size={12} /> Encrypted
          </span>
          <div className="pose-instruction">
            <strong>Position your face in the oval</strong>
            <small>Look straight ahead and keep still</small>
          </div>
        </div>
        <div className="capture-guides">
          <span className="done">
            <Icon name="check" size={11} /> Good lighting
          </span>
          <span>
            <Icon name="user" size={11} /> One face
          </span>
          <span>
            <Icon name="camera" size={11} /> No glasses
          </span>
        </div>
        <button className="capture-button" onClick={startProcessing}>
          <span>
            <i />
          </span>
          Capture & verify
        </button>
        <button className="face-back-action" onClick={() => setStage("intro")}>
          Not ready? Go back
        </button>
      </div>
    );
  }

  if (stage === "processing") {
    return (
      <div className="face-verification face-processing">
        <div className="processing-face">
          <div className="processing-ring pr-one" />
          <div className="processing-ring pr-two" />
          <img src={creators[0].image} alt="Captured face" />
          <span className="processing-scan" />
          {Array.from({ length: 8 }).map((_, index) => (
            <i className={`process-point pp-${index + 1}`} key={index} />
          ))}
        </div>
        <span className="processing-kicker">
          <i /> ANALYSING LIVE CAPTURE
        </span>
        <h3>Checking your identity…</h3>
        <p>Keep this screen open. This usually takes only a few seconds.</p>
        <div className="processing-checks">
          <div className="complete">
            <span>
              <Icon name="check" size={11} />
            </span>
            <p>
              <strong>Face detected</strong>
              <small>Capture quality looks good</small>
            </p>
          </div>
          <div className="complete">
            <span>
              <Icon name="check" size={11} />
            </span>
            <p>
              <strong>Liveness check</strong>
              <small>Natural movement confirmed</small>
            </p>
          </div>
          <div className="working">
            <span>
              <i />
            </span>
            <p>
              <strong>Identity match</strong>
              <small>Comparing facial markers…</small>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="face-verification face-verified">
      <div className="verified-face-scene">
        <div className="verified-burst vb-one" />
        <div className="verified-burst vb-two" />
        <img src={creators[0].image} alt="Verified profile" />
        <span className="face-verified-check">
          <Icon name="check" size={23} />
        </span>
        <i className="verified-particle vp-one" />
        <i className="verified-particle vp-two" />
        <i className="verified-particle vp-three" />
      </div>
      <span className="verified-label">
        <Icon name="shield" size={12} /> FACE VERIFIED
      </span>
      <h3>Identity confirmed</h3>
      <p>Your liveness check passed and your face was successfully matched.</p>
      <div className="verification-score">
        <div>
          <strong>98.6%</strong>
          <span>Face match</span>
        </div>
        <div>
          <strong>Passed</strong>
          <span>Liveness</span>
        </div>
        <div>
          <strong>High</strong>
          <span>Quality</span>
        </div>
      </div>
      <div className="privacy-confirmation">
        <Icon name="shield" size={16} />
        <p>
          <strong>Your live capture is protected</strong>
          <small>Temporary biometric data has been deleted.</small>
        </p>
      </div>
      <button className="face-retry" onClick={() => setStage("camera")}>
        Retake verification
      </button>
    </div>
  );
}

function SocialConnections({ creatorMode }: { creatorMode: boolean }) {
  const [connected, setConnected] = useState(["Instagram"]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const accounts = [
    {
      name: "Instagram",
      icon: "instagram" as IconName,
      handle: creatorMode ? "@aarohi.edits" : "@theloom.in",
      metric: creatorMode ? "248K followers" : "84K followers",
      color: "instagram",
    },
    {
      name: "YouTube",
      icon: "youtube" as IconName,
      handle: creatorMode ? "@AarohiCreates" : "@TheLoomIndia",
      metric: creatorMode ? "92K subscribers" : "12K subscribers",
      color: "youtube",
    },
    {
      name: "Facebook",
      icon: "facebook" as IconName,
      handle: creatorMode ? "Aarohi Mehta" : "The Loom India",
      metric: creatorMode ? "36K followers" : "51K followers",
      color: "facebook",
    },
  ];

  const connect = (name: string) => {
    if (connected.includes(name)) {
      setConnected((items) => items.filter((item) => item !== name));
      return;
    }
    setSyncing(name);
    window.setTimeout(() => {
      setConnected((items) => [...items, name]);
      setSyncing(null);
    }, 1100);
  };

  return (
    <div className="social-connections">
      <div className="social-network-visual">
        <div className="network-ring outer-ring" />
        <div className="network-ring inner-ring" />
        <svg className="network-lines" viewBox="0 0 390 240" preserveAspectRatio="none" aria-hidden>
          <path className="network-spoke spoke-instagram" d="M195 112 72 60" />
          <path className="network-spoke spoke-youtube" d="M195 112 318 60" />
          <path className="network-spoke spoke-facebook" d="M195 112 307 182" />
          <circle className="network-junction" cx="195" cy="112" r="4" />
        </svg>
        <div className="network-profile connection-hub" aria-label="Secure social connection hub">
          <span>
            <Icon name="link" size={25} />
          </span>
          <b className="hub-pulse" />
          <i>
            <Icon name="check" size={8} />
          </i>
        </div>
        {accounts.map((account, index) => (
          <button
            className={`network-platform np-${index} ${connected.includes(account.name) ? "connected" : ""}`}
            key={account.name}
            onClick={() => connect(account.name)}
          >
            <span className={account.color}>
              <Icon name={account.icon} size={19} />
            </span>
            {connected.includes(account.name) && (
              <i>
                <Icon name="check" size={9} />
              </i>
            )}
          </button>
        ))}
        <div className="network-status">
          <span>
            <i /> LIVE SYNC
          </span>
          <strong>{connected.length} of 3 connected</strong>
        </div>
      </div>

      <div className="social-account-list">
        {accounts.map((account) => {
          const isConnected = connected.includes(account.name);
          const isSyncing = syncing === account.name;
          return (
            <article className={isConnected ? "connected" : ""} key={account.name}>
              <span className={`social-app-icon ${account.color}`}>
                <Icon name={account.icon} size={21} />
                {isConnected && (
                  <i>
                    <Icon name="check" size={8} />
                  </i>
                )}
              </span>
              <div>
                <strong>{account.name}</strong>
                <small>{isConnected ? account.handle : "Connect your account"}</small>
                {isConnected && <em>{account.metric}</em>}
              </div>
              <button
                className={isSyncing ? "syncing" : ""}
                onClick={() => connect(account.name)}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <i /> Syncing
                  </>
                ) : isConnected ? (
                  "Manage"
                ) : (
                  <>
                    <Icon name="link" size={12} /> Connect
                  </>
                )}
              </button>
              {isSyncing && (
                <div className="sync-progress">
                  <i />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {connected.length > 0 && (
        <div className="social-data-preview">
          <header>
            <div>
              <span>LIVE DATA PREVIEW</span>
              <strong>{creatorMode ? "Audience intelligence" : "Brand social reach"}</strong>
            </div>
            <i>
              <Icon name="sparkles" size={15} />
            </i>
          </header>
          <div className="sync-metrics">
            <div>
              <strong>{creatorMode ? "248K" : "147K"}</strong>
              <span>Total audience</span>
              <i>
                <b style={{ width: "82%" }} />
              </i>
            </div>
            <div>
              <strong>{creatorMode ? "5.8%" : "4.2%"}</strong>
              <span>Engagement</span>
              <i>
                <b style={{ width: "64%" }} />
              </i>
            </div>
            <div>
              <strong>{creatorMode ? "182K" : "96K"}</strong>
              <span>Avg. reach</span>
              <i>
                <b style={{ width: "73%" }} />
              </i>
            </div>
          </div>
          <p>
            <Icon name="clock" size={12} /> Metrics refresh automatically every 24 hours
          </p>
        </div>
      )}

      <div className="oauth-note">
        <span>
          <Icon name="shield" size={17} />
        </span>
        <p>
          <strong>Secure, read-only connection</strong>
          <small>We never post without permission or store your passwords.</small>
        </p>
      </div>
    </div>
  );
}

function formatAudienceCount(value?: number) {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

function ContentPerformance({
  fields,
  setField,
}: {
  fields: Record<string, string>;
  setField: (key: string, value: string) => void;
}) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  useEffect(() => {
    api
      .me()
      .then(({ user }) => {
        const social = user.profile?.social;
        if (social && typeof social === "object") setAccounts(Object.values(social) as SocialAccount[]);
      })
      .catch(() => {});
  }, []);
  return (
    <div className="field-stack">
      {accounts.length === 0 && (
        <p className="flow-error" style={{ color: "inherit" }}>
          Connect Instagram or YouTube on the earlier step. Views and the view rate are filled from that account.
        </p>
      )}
      {accounts.map((account) => (
        <p key={account.platform}>
          <strong>{account.name}</strong> · {formatAudienceCount(account.followers)}{" "}
          {account.platform === "youtube" ? "subscribers" : "followers"}
          {account.views ? ` · ${formatAudienceCount(account.views)} avg views` : ""}
          {account.viewRate ? ` · ${account.viewRate}% view rate` : ""}
        </p>
      ))}
      <label>
        NOTES FOR BRANDS
        <input
          value={fields["Content Performance:NOTES"] || ""}
          placeholder="Anything the imported numbers do not show"
          onChange={(event) => setField("Content Performance:NOTES", event.target.value)}
        />
      </label>
    </div>
  );
}

function AudienceInformation({
  creatorMode,
  selected,
  toggle,
}: {
  creatorMode: boolean;
  selected: string[];
  toggle: (value: string) => void;
}) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [location, setLocation] = useState("");
  useEffect(() => {
    api
      .me()
      .then(({ user }) => {
        const social = user.profile?.social;
        if (social && typeof social === "object") setAccounts(Object.values(social) as SocialAccount[]);
        const savedFields = user.profile?.fields as Record<string, string> | undefined;
        setLocation(savedFields?.["Location Details:LOCATION"] || "");
      })
      .catch(() => {});
  }, []);
  const followers = accounts.reduce((sum, account) => sum + (account.followers || 0), 0);
  const viewRates = accounts.map((account) => account.viewRate || 0).filter(Boolean);
  const viewRate = viewRates.length
    ? Math.round((viewRates.reduce((sum, value) => sum + value, 0) / viewRates.length) * 10) / 10
    : undefined;

  return (
    <div className="audience-builder">
      <div className="audience-overview">
        <div className="audience-total">
          <span>
            <Icon name="user" size={19} />
          </span>
          <p>
            <small>{creatorMode ? "TOTAL AUDIENCE" : "CONNECTED REACH"}</small>
            <strong>{accounts.length ? formatAudienceCount(followers) : "—"}</strong>
          </p>
          {viewRate ? (
            <b>
              <Icon name="trending" size={12} /> {viewRate}%
            </b>
          ) : null}
        </div>
        <div className="audience-source">
          <span className="source-instagram">
            <Icon name="instagram" size={14} />
          </span>
          <p>
            <strong>
              {accounts.length
                ? accounts.map((account) => account.handle).join(" · ")
                : "No account connected yet"}
            </strong>
            <small>
              {accounts.length
                ? "Imported from the accounts you approved"
                : "Connect Instagram or YouTube to import followers"}
            </small>
          </p>
          {accounts.length > 0 && <Icon name="check" size={14} />}
        </div>
      </div>

      {accounts.map((account) => (
        <section className="demographic-card" key={account.platform}>
          <header>
            <div>
              <span>{account.platform.toUpperCase()}</span>
              <strong>{account.name}</strong>
            </div>
          </header>
          <p className="chart-insight">
            <Icon name="sparkles" size={14} />
            <span>
              {formatAudienceCount(account.followers)} {account.platform === "youtube" ? "subscribers" : "followers"}
              {account.following ? ` · ${formatAudienceCount(account.following)} following` : ""}
              {account.posts ? ` · ${account.posts} posts` : ""}
              {account.viewRate ? ` · ${account.viewRate}% view rate` : ""}
            </span>
          </p>
        </section>
      ))}

      <section className="audience-locations">
        <header>
          <span>YOUR LOCATION</span>
        </header>
        <div>
          <button type="button">
            <i style={{ background: "#dfff4f" }}>
              <Icon name="pin" size={13} />
            </i>
            <span>
              <strong>{location || "Location not added"}</strong>
              <small>{location ? "Saved from location details" : "Add it on the location step"}</small>
            </span>
          </button>
        </div>
      </section>

      <label className="audience-traits-label">AUDIENCE TRAITS</label>
      <div className="audience-traits">
        {["Urban", "Gen Z", "Premium buyers", "Professionals", "High intent"].map((trait) => (
          <button
            className={selected.includes(trait) ? "active" : ""}
            onClick={() => toggle(trait)}
            key={trait}
          >
            {trait}
            {selected.includes(trait) ? (
              <Icon name="check" size={11} />
            ) : (
              <Icon name="plus" size={11} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnimatedLocationMap({
  creatorMode,
  onSelect,
  selected,
}: {
  creatorMode: boolean;
  onSelect: (city: string) => void;
  selected: string[];
}) {
  const cities = [
    {
      name: "Mumbai",
      state: "Maharashtra",
      count: "1.2K",
      districts: ["Bandra", "Andheri", "Lower Parel"],
    },
    { name: "Delhi NCR", state: "Delhi", count: "980", districts: ["Gurugram", "Saket", "Noida"] },
    {
      name: "Bengaluru",
      state: "Karnataka",
      count: "840",
      districts: ["Indiranagar", "Koramangala", "HSR"],
    },
    {
      name: "Pune",
      state: "Maharashtra",
      count: "420",
      districts: ["Koregaon Park", "Baner", "Viman Nagar"],
    },
  ];
  const [activeCity, setActiveCity] = useState(cities[0]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [chosen, setChosen] = useState(selected[selected.length - 1] || "");
  const [locating, setLocating] = useState(false);
  const chooseCity = (city: (typeof cities)[0]) => {
    setActiveCity(city);
    setChosen(`${city.name}, ${city.state}`);
    onSelect(`${city.name}, ${city.state}`);
  };
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      api
        .searchPlaces(text)
        .then((data) => setResults(data.places || []))
        .catch(() => setResults([]));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        api
          .reversePlace(position.coords.latitude, position.coords.longitude)
          .then(({ place }) => {
            setChosen(place.label);
            onSelect(place.label);
            setQuery("");
            setResults([]);
          })
          .finally(() => setLocating(false));
      },
      () => setLocating(false),
    );
  };

  return (
    <div className="animated-location">
      <label className="map-field-label">SEARCH ANY PLACE</label>
      <div className="location-search">
        <Icon name="search" size={16} />
        <input
          value={query}
          placeholder="City, neighbourhood, or address"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {results.length > 0 && (
        <div className="place-results">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => {
                setChosen(place.label);
                onSelect(place.label);
                setQuery(place.city || place.label);
                setResults([]);
              }}
            >
              <strong>{place.city || place.label.split(",")[0]}</strong>
              <small>{place.label}</small>
            </button>
          ))}
        </div>
      )}
      <label className="map-field-label">COUNTRY</label>
      <button className="map-country">
        <span className="india-flag">IN</span>
        <strong>India</strong>
        <Icon name="chevron" size={15} />
      </button>

      <div className="live-map">
        <svg className="map-canvas" viewBox="0 0 390 290" preserveAspectRatio="none" aria-hidden>
          <path className="map-block b1" d="M-20 38 85 10l52 62-82 63-74-32Z" />
          <path className="map-block b2" d="m155-20 110 12 15 85-93 38-47-58Z" />
          <path className="map-block b3" d="m288 23 122-10 14 112-112 28-37-69Z" />
          <path className="map-block b4" d="m-15 164 111-35 61 55-30 110H-20Z" />
          <path className="map-block b5" d="m174 124 86-35 65 68-22 129-124 20-38-84Z" />
          <path className="map-block b6" d="m326 171 92-34 12 168-119-8Z" />
          <path className="map-road-wide" d="M-20 225C75 177 101 211 171 167s140-26 239-95" />
          <path
            className="map-road-thin"
            d="M47-20c17 85 68 101 81 166s-9 94-2 167M281-20c-19 62 19 98 6 154s-57 89-42 178"
          />
          <path
            className="animated-route-shadow"
            d="M46 247C92 215 117 237 151 201s52-18 75-53 56-38 94-69"
          />
          <path
            className="animated-route"
            pathLength="1"
            d="M46 247C92 215 117 237 151 201s52-18 75-53 56-38 94-69"
          />
        </svg>

        <div className="map-live-badge">
          <i /> LIVE CREATOR MAP
        </div>
        <button className="map-locate" type="button" aria-label="Use current location" onClick={useMyLocation}>
          <Icon name="pin" size={17} />
        </button>

        <span className="district-label district-one">{activeCity.districts[0]}</span>
        <span className="district-label district-two">{activeCity.districts[1]}</span>
        <span className="district-label district-three">{activeCity.districts[2]}</span>

        <div className="selected-map-pin">
          <i className="pin-wave wave-one" />
          <i className="pin-wave wave-two" />
          <span>
            <Icon name="pin" size={20} />
          </span>
        </div>

        <div className="creator-map-dot md-one">
          <img src={creators[0].image} alt="" />
          <i />
        </div>
        <div className="creator-map-dot md-two">
          <img src={creators[1].image} alt="" />
          <i />
        </div>
        <div className="creator-map-dot md-three">
          <img src={creators[2].image} alt="" />
          <i />
        </div>
        <div className="creator-map-dot md-four">
          <img src={creators[3].image} alt="" />
          <i />
        </div>

        <span className="moving-signal signal-one" />
        <span className="moving-signal signal-two" />

        <div className="map-summary">
          <div className="summary-faces">
            {creators.slice(0, 3).map((creator) => (
              <img key={creator.id} src={creator.image} alt="" />
            ))}
            <strong>+{activeCity.count}</strong>
          </div>
          <p>
            <strong>{chosen || `${activeCity.name}, ${activeCity.state}`}</strong>
            <small>{locating ? "Finding you…" : creatorMode ? "Brands can discover you here" : "Campaigns can target this place"}</small>
          </p>
          <Icon name="sparkles" size={17} />
        </div>
      </div>

      <div className="active-location-row">
        <span>
          <Icon name="pin" size={16} />
        </span>
        <p>
          <small>SELECTED LOCATION</small>
          <strong>{chosen || `${activeCity.name}, ${activeCity.state}`}</strong>
        </p>
        <b>
          <Icon name="check" size={13} />
        </b>
      </div>

      <label className="map-field-label">POPULAR MARKETS</label>
      <div className="animated-city-pills">
        {cities.map((city) => (
          <button
            className={activeCity.name === city.name ? "active" : ""}
            key={city.name}
            onClick={() => chooseCity(city)}
          >
            {city.name}
            {selected.includes(city.name) && <Icon name="check" size={11} />}
          </button>
        ))}
      </div>

      <div className="radius-control">
        <div>
          <span>DISCOVERY RADIUS</span>
          <strong>25 km</strong>
        </div>
        <div className="radius-track">
          <i />
        </div>
        <small>
          {creatorMode
            ? "Brands within this radius can discover your profile."
            : "We’ll prioritise creators within this campaign area."}
        </small>
      </div>
    </div>
  );
}

function AIAnalysis({ role }: { role: OnboardingRole }) {
  return (
    <div className="ai-analysis">
      <div className="analysis-orb">
        <Icon name="sparkles" size={30} />
        <i />
        <i />
      </div>
      <h3>
        Building your {role === "brand" ? "distribution strategy" : "creator intelligence profile"}
      </h3>
      <div className="analysis-lines">
        {["Understanding your profile", "Mapping audience fit", "Finding growth opportunities"].map(
          (x, i) => (
            <div key={x}>
              <span>
                <Icon name="check" size={12} />
              </span>
              <p>
                {x}
                <small>{i === 2 ? "Analysing…" : "Complete"}</small>
              </p>
            </div>
          ),
        )}
      </div>
      <div className="ai-disclaimer">
        AI recommendations are directional and not guaranteed results.
      </div>
    </div>
  );
}

function ReviewProfile() {
  return (
    <div className="review-sections">
      {[
        ["Business", "The Loom · D2C fashion"],
        ["Goals", "Awareness, sales, UGC"],
        ["Creator preferences", "Micro and mid-tier creators"],
        ["Markets", "Mumbai, Delhi NCR, Bengaluru"],
        ["Budget", "₹50K – ₹1L per campaign"],
      ].map(([label, value]) => (
        <button key={label}>
          <span>
            <small>{label}</small>
            <strong>{value}</strong>
          </span>
          <b>Edit</b>
        </button>
      ))}
      <label className="consent-check">
        <input type="checkbox" defaultChecked />
        <i>
          <Icon name="check" size={10} />
        </i>
        <span>I confirm these details are accurate.</span>
      </label>
    </div>
  );
}

function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<"brand" | "creator">("brand");
  const [goals, setGoals] = useState(["Creator discovery", "Campaign management"]);
  const [city, setCity] = useState("Mumbai");

  const next = () => (step < 4 ? setStep(step + 1) : onFinish());
  const back = () => setStep(Math.max(0, step - 1));
  const toggleGoal = (goal: string) =>
    setGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );

  if (step === 0) {
    return (
      <div className="onboarding-screen welcome-screen">
        <StatusBar />
        <div className="welcome-brand">
          <span className="welcome-mark">
            <i />
            <i />
            <i />
          </span>
          Orbitly
        </div>
        <button className="onboard-skip" onClick={onFinish}>
          Skip
        </button>
        <div className="welcome-collage">
          <img
            className="welcome-main"
            src="https://images.unsplash.com/photo-1747264464985-2bc2e20c739e?crop=faces&fit=crop&w=800&h=1000&q=90"
            alt="Fashion creator"
          />
          <img
            className="welcome-side one"
            src="https://images.unsplash.com/photo-1612130536441-95ece5dcbb86?crop=faces&fit=crop&w=500&h=650&q=90"
            alt="Creator filming content"
          />
          <img
            className="welcome-side two"
            src="https://images.unsplash.com/photo-1582797536372-862bb193b69a?crop=faces&fit=crop&w=500&h=650&q=90"
            alt="Lifestyle creator"
          />
          <span className="floating-stat creators">
            <Icon name="user" size={13} />
            12K+ creators
          </span>
          <span className="floating-stat reach">
            <Icon name="trending" size={13} />
            48M reach
          </span>
        </div>
        <div className="welcome-panel">
          <span className="onboard-kicker">CREATOR-POWERED GROWTH</span>
          <h1>
            Distribution that
            <br />
            <em>moves people.</em>
          </h1>
          <p>Discover, book, and grow with creators your audience already trusts.</p>
          <div className="onboard-dots">
            <i className="active" />
            <i />
            <i />
            <i />
          </div>
          <button className="onboard-primary" onClick={next}>
            Get started <Icon name="arrow" size={17} />
          </button>
          <button className="login-link" type="button" onClick={onFinish}>
            Already have an account? <strong>Log in</strong>
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="onboarding-screen ready-screen">
        <StatusBar />
        <div className="ready-visual">
          <div className="ready-ring ring-one" />
          <div className="ready-ring ring-two" />
          <img src={creators[0].image} alt="" />
          <img src={creators[1].image} alt="" />
          <img src={creators[2].image} alt="" />
          <span className="ready-check">
            <Icon name="check" size={28} />
          </span>
          <span className="ready-chip chip-one">96% match</span>
          <span className="ready-chip chip-two">Mumbai</span>
        </div>
        <div className="ready-copy">
          <span className="onboard-kicker">YOU'RE ALL SET</span>
          <h1>Your creator network is ready.</h1>
          <p>We found 24 high-fit creators and 8 live opportunities for The Loom.</p>
        </div>
        <div className="setup-summary">
          <div>
            <span>
              <Icon name="shield" size={17} />
            </span>
            <p>
              <strong>Business profile created</strong>
              <small>Verification can be completed later</small>
            </p>
            <Icon name="check" size={16} />
          </div>
          <div>
            <span>
              <Icon name="sparkles" size={17} />
            </span>
            <p>
              <strong>Recommendations personalised</strong>
              <small>Based on your goals and location</small>
            </p>
            <Icon name="check" size={16} />
          </div>
        </div>
        <div className="onboard-footer">
          <button className="onboard-primary" onClick={onFinish}>
            Explore your matches <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-screen setup-screen">
      <StatusBar />
      <header className="setup-header">
        <button onClick={back}>‹</button>
        <div className="setup-progress">
          {[1, 2, 3].map((item) => (
            <i key={item} className={step >= item ? "active" : ""} />
          ))}
        </div>
        <button className="text-skip" onClick={onFinish}>
          Skip
        </button>
      </header>

      {step === 1 && (
        <div className="setup-content">
          <span className="step-count">STEP 1 OF 3</span>
          <h1>How will you use Orbitly?</h1>
          <p className="setup-intro">Choose your account type. You can invite teammates later.</p>
          <div className="account-options">
            <button
              className={account === "brand" ? "active" : ""}
              onClick={() => setAccount("brand")}
            >
              <span className="account-art brand-art">
                <Icon name="briefcase" size={26} />
                <i />
              </span>
              <span>
                <strong>I'm a brand or business</strong>
                <small>Discover creators, run campaigns, and measure results.</small>
              </span>
              <i className="select-radio">
                <b />
              </i>
            </button>
            <button
              className={account === "creator" ? "active" : ""}
              onClick={() => setAccount("creator")}
            >
              <span className="account-art creator-art">
                <Icon name="camera" size={26} />
                <i />
              </span>
              <span>
                <strong>I'm a creator</strong>
                <small>Find paid opportunities, manage work, and get paid.</small>
              </span>
              <i className="select-radio">
                <b />
              </i>
            </button>
          </div>
          <div className="trust-note">
            <Icon name="shield" size={17} />
            <p>
              <strong>Your information stays private</strong>
              <small>We only use it to personalise your experience.</small>
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="setup-content">
          <span className="step-count">STEP 2 OF 3</span>
          <h1>What do you want to achieve?</h1>
          <p className="setup-intro">
            Select all that apply. We'll tailor your workspace around them.
          </p>
          <div className="goal-grid">
            {[
              ["Creator discovery", "search", "Find the right voices"],
              ["Campaign management", "briefcase", "Run work in one place"],
              ["UGC production", "camera", "Order ready-to-use content"],
              ["Affiliate growth", "trending", "Drive trackable sales"],
              ["Local awareness", "pin", "Reach nearby audiences"],
              ["Performance insights", "sparkles", "Measure and optimise"],
            ].map(([label, icon, description]) => (
              <button
                key={label}
                className={goals.includes(label) ? "active" : ""}
                onClick={() => toggleGoal(label)}
              >
                <span>
                  <Icon name={icon as IconName} size={21} />
                </span>
                <strong>{label}</strong>
                <small>{description}</small>
                <i>
                  <Icon name="check" size={11} />
                </i>
              </button>
            ))}
          </div>
          <p className="selection-count">{goals.length} selected</p>
        </div>
      )}

      {step === 3 && (
        <div className="setup-content location-step">
          <span className="step-count">STEP 3 OF 3</span>
          <h1>Where do you want to grow?</h1>
          <p className="setup-intro">
            Choose your primary market. You can add more locations at any time.
          </p>
          <div className="location-search">
            <Icon name="search" size={18} />
            <span>{city}, India</span>
          </div>
          <div className="city-map">
            <div className="map-road r1" />
            <div className="map-road r2" />
            <div className="map-road r3" />
            <span className="map-label l1">Bandra</span>
            <span className="map-label l2">Andheri</span>
            <span className="map-label l3">Lower Parel</span>
            <span className="map-pin">
              <Icon name="pin" size={19} />
            </span>
            <div className="map-creators">
              {creators.slice(0, 3).map((creator) => (
                <img key={creator.id} src={creator.image} alt="" />
              ))}
              <strong>+1.2K</strong>
            </div>
          </div>
          <label className="city-label">POPULAR MARKETS</label>
          <div className="city-pills">
            {["Mumbai", "Delhi NCR", "Bengaluru", "Pune"].map((item) => (
              <button
                className={city === item ? "active" : ""}
                onClick={() => setCity(item)}
                key={item}
              >
                {item}
                {city === item && <Icon name="check" size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="onboard-footer">
        <button
          className="onboard-primary"
          onClick={next}
          disabled={step === 2 && goals.length === 0}
        >
          Continue <Icon name="arrow" size={17} />
        </button>
        <p>Your progress is saved automatically</p>
      </div>
    </div>
  );
}
