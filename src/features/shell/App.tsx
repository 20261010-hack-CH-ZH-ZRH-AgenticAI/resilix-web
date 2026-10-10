"use client";
import { ActionButton, Icon, type IconName } from "@resilix/ui-components";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthDialog } from "@/features/auth/AuthDialog";
import { Chat } from "@/features/chat/Chat";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { PersonalAlertDialog } from "@/features/dashboard/PersonalAlertDialog";
import { Landing } from "@/features/landing/Landing";
import { MapWorkspaceProvider } from "@/features/maps/MapWorkspaceProvider";
import { WorkflowPanel } from "@/features/workflows/WorkflowPanel";
import { useSituation } from "@/hooks/useSituation";
import {
  authenticate,
  deleteAlert,
  getSession,
  logout,
  type User,
} from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import type { MessageKey } from "@/lib/i18n/messages";
import { usePreferences } from "@/lib/i18n/Provider";
import { Brand } from "./Brand";
import { Preferences } from "./Preferences";
import styles from "./ShellStyles.module.css";

type View = "overview" | "map" | "chat" | "alerts" | "supervisor";
const navigation: { id: View; label: MessageKey; icon: IconName }[] = [
  { id: "overview", label: "overview", icon: "grid" },
  { id: "map", label: "liveMap", icon: "map" },
  { id: "chat", label: "assistant", icon: "chat" },
  { id: "alerts", label: "privateAlerts", icon: "bell" },
  { id: "supervisor", label: "supervisor", icon: "shield" },
];
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function App({ showLogin = false }: { showLogin?: boolean }) {
  const { t } = usePreferences();
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(showLogin);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [sidebar, setSidebar] = useState(false);
  const [create, setCreate] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<MessageKey | "">("");
  const [online, setOnline] = useState(true);
  const [install, setInstall] = useState<InstallEvent>();
  const situation = useSituation(Boolean(user));
  useEffect(() => {
    let alive = true;
    void getSession()
      .then((value) => {
        if (alive) setUser(value);
      })
      .catch(() => undefined);
    const update = () => setOnline(navigator.onLine);
    const installable = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("beforeinstallprompt", installable);
    return () => {
      alive = false;
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("beforeinstallprompt", installable);
    };
  }, []);
  const onUser = (value: User) => {
    setUser(value);
    setView("overview");
    setError("");
  };
  const demo = async () => {
    setBusy(true);
    setError("");
    try {
      onUser(await authenticate("demo"));
    } catch (reason) {
      setError(apiErrorKey(reason));
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    try {
      await logout();
      setUser(null);
      setPrompt("");
    } catch (reason) {
      setError(apiErrorKey(reason));
    }
  };
  const navigate = (next: View) => {
    setView(next);
    setSidebar(false);
  };
  const ask = (text: string) => {
    setPrompt(text);
    navigate("chat");
  };
  const onPromptUsed = useCallback(() => setPrompt(""), []);
  const remove = async (id: string) => {
    try {
      await deleteAlert(id);
      await situation.refresh();
    } catch (reason) {
      setError(apiErrorKey(reason));
    }
  };
  if (!user)
    return (
      <>
        {error && (
          <p className={styles.error} role="alert">
            {t(error)}
          </p>
        )}
        <Landing onDemo={demo} onSignIn={() => setAuthOpen(true)} busy={busy} />
        <AuthDialog
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onUser={onUser}
        />
      </>
    );
  return (
    <MapWorkspaceProvider
      key={user.id}
      alerts={situation.alerts}
      personal={situation.personal}
      config={situation.config}
    >
      <div className={styles.app}>
        {sidebar && (
          <button
            type="button"
            className={styles.overlay}
            onClick={() => setSidebar(false)}
            aria-label={t("close")}
          />
        )}
        <aside
          className={`${styles.sidebar} ${sidebar ? styles.sidebarOpen : ""}`}
        >
          <div className={styles.sidebarBrand}>
            <Brand />
          </div>
          <p className={styles.sectionLabel}>{t("workspace")}</p>
          <nav className={styles.navigation}>
            {navigation.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`${styles.navButton} ${view === item.id ? styles.navActive : ""}`}
                onClick={() => navigate(item.id)}
                aria-current={view === item.id ? "page" : undefined}
              >
                <Icon name={item.icon} />
                {t(item.label)}
                {item.id === "alerts" && situation.personal.length > 0 && (
                  <span className={styles.navCount}>
                    {situation.personal.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <p className={styles.sectionLabel}>{t("resources")}</p>
          <Link className={styles.navButton} href="/deck/JO202610101600">
            <Icon name="layers" />
            {t("pitch")}
          </Link>
          {install && (
            <button
              type="button"
              className={styles.navButton}
              onClick={async () => {
                await install.prompt();
                await install.userChoice;
                setInstall(undefined);
              }}
            >
              <Icon name="download" />
              {t("install")}
            </button>
          )}
          <div className={styles.sidebarBottom}>
            <div className={styles.helpCard}>
              <Icon name="shield" />
              <strong>{t("urgentHelp")}</strong>
              <p>{t("emergency")}</p>
              <a href="tel:112">112 ↗</a>
            </div>
            <div className={styles.userRow}>
              <span className={styles.avatar}>
                {user.name
                  .split(" ")
                  .map((value) => value[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className={styles.userName}>
                {user.name}
                <span className={styles.userType}>
                  {t(user.is_demo ? "demoSession" : "ownerOnly")}
                </span>
              </div>
              <button
                type="button"
                className={styles.logout}
                onClick={signOut}
                aria-label={t("signOut")}
                title={t("signOut")}
              >
                <Icon name="logout" width={17} />
              </button>
            </div>
          </div>
        </aside>
        <div className={styles.body}>
          <header className={styles.topbar}>
            <div className={styles.breadcrumbs}>
              <div className={styles.mobileMenu}>
                <ActionButton
                  compact
                  variant="ghost"
                  onClick={() => setSidebar(true)}
                  aria-label={t("menu")}
                >
                  <Icon name="grid" />
                </ActionButton>
              </div>
              <span>Resilix</span>
              <Icon name="chevron" width={13} />
              <span>
                {t(
                  navigation.find((item) => item.id === view)?.label ??
                    "overview",
                )}
              </span>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.onlineStatus}>
                <i className={styles.onlineDot} />
                {t(situation.connected ? "connected" : "reconnecting")}
              </span>
              <Preferences />
            </div>
          </header>
          {!online && (
            <output className={styles.offline}>{t("offline")}</output>
          )}
          <main className={styles.content}>
            {(error || situation.error) && (
              <p className={styles.error} role="alert">
                {t(error || situation.error || "errorUnknown")}
              </p>
            )}
            {view === "supervisor" && <WorkflowPanel />}
            {view !== "chat" && view !== "supervisor" && (
              <Dashboard
                view={view}
                {...situation}
                onCreate={() => setCreate(true)}
                onAsk={ask}
                onRefresh={situation.refresh}
                onDelete={remove}
                onView={navigate}
              />
            )}
            <div hidden={view !== "chat"}>
              <Chat
                models={situation.models}
                prompt={prompt}
                active={view === "chat"}
                onPromptUsed={onPromptUsed}
              />
            </div>
          </main>
          <footer className={styles.legal}>{t("boundary")}</footer>
        </div>
        <PersonalAlertDialog
          open={create}
          onClose={() => setCreate(false)}
          onCreated={situation.refresh}
        />
      </div>
    </MapWorkspaceProvider>
  );
}
