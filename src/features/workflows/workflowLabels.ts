import type { Language } from "@/lib/i18n/messages";

export const workflowLabels: Record<Language, Record<string, string>> = {
  en: {
    title: "Human control, at every step.",
    subtitle:
      "Turn a situation into a reviewed preparedness drill. Your plans are private to your account.",
    simulation: "Simulation only",
    boundary:
      "Approval records a simulated responder acknowledgement. It does not contact emergency services, issue alerts, or certify a safe route.",
    form: "Create a response proposal",
    name: "Situation title",
    context: "What is happening?",
    hint: "Describe a drill using fictional details. Do not include medical records or personal identifiers.",
    create: "Generate proposal",
    working: "Working…",
    empty: "No proposals yet. Create a drill to review the assistant’s plan.",
    proposed: "Awaiting your decision",
    approved: "Approved · simulation completed",
    rejected: "Rejected · no action taken",
    approve: "Approve simulation",
    reject: "Reject proposal",
    receipt: "Recorded outcome",
    completed:
      "The simulated responder acknowledged the approved plan. No external action was taken.",
    notExecuted: "The proposal was rejected and was not executed.",
    refresh: "Refresh",
    error: "Refresh to verify the recorded proposal or decision.",
    source: "Source",
    model: "Model",
    loading: "Loading your private proposals…",
  },
  es: {
    title: "Control humano en cada paso.",
    subtitle:
      "Convierte una situación en un simulacro revisado. Tus planes son privados y solo accesibles desde tu cuenta.",
    simulation: "Solo simulación",
    boundary:
      "La aprobación registra una confirmación de un interviniente simulado. No contacta con emergencias, emite alertas ni certifica una ruta segura.",
    form: "Crear una propuesta de respuesta",
    name: "Título de la situación",
    context: "¿Qué está ocurriendo?",
    hint: "Describe un simulacro con datos ficticios. No incluyas historias clínicas ni identificadores personales.",
    create: "Generar propuesta",
    working: "Procesando…",
    empty:
      "Todavía no hay propuestas. Crea un simulacro para revisar el plan del asistente.",
    proposed: "Pendiente de tu decisión",
    approved: "Aprobado · simulación completada",
    rejected: "Rechazado · sin ejecutar",
    approve: "Aprobar simulación",
    reject: "Rechazar propuesta",
    receipt: "Resultado registrado",
    completed:
      "El interviniente simulado confirmó el plan aprobado. No se realizó ninguna acción externa.",
    notExecuted: "La propuesta fue rechazada y no se ejecutó.",
    refresh: "Actualizar",
    error: "Actualiza para comprobar la propuesta o decisión registrada.",
    source: "Fuente",
    model: "Modelo",
    loading: "Cargando tus propuestas privadas…",
  },
  de: {
    title: "Menschliche Kontrolle bei jedem Schritt.",
    subtitle:
      "Erstelle aus einer Situation eine überprüfte Vorsorgeübung. Deine Pläne sind nur für dein Konto zugänglich.",
    simulation: "Nur Simulation",
    boundary:
      "Die Freigabe speichert die Bestätigung einer simulierten Einsatzkraft. Es werden keine Notdienste kontaktiert, Warnungen ausgegeben oder sichere Routen bestätigt.",
    form: "Einen Handlungsvorschlag erstellen",
    name: "Titel der Situation",
    context: "Was passiert gerade?",
    hint: "Beschreibe eine Übung mit erfundenen Angaben. Keine Krankenakten oder persönlichen Kennungen eingeben.",
    create: "Vorschlag erstellen",
    working: "Wird bearbeitet…",
    empty:
      "Noch keine Vorschläge. Erstelle eine Übung, um den Plan des Assistenten zu prüfen.",
    proposed: "Wartet auf deine Entscheidung",
    approved: "Freigegeben · Simulation abgeschlossen",
    rejected: "Abgelehnt · nicht ausgeführt",
    approve: "Simulation freigeben",
    reject: "Vorschlag ablehnen",
    receipt: "Gespeichertes Ergebnis",
    completed:
      "Die simulierte Einsatzkraft hat den freigegebenen Plan bestätigt. Es wurde keine externe Aktion ausgeführt.",
    notExecuted: "Der Vorschlag wurde abgelehnt und nicht ausgeführt.",
    refresh: "Aktualisieren",
    error:
      "Aktualisiere, um den gespeicherten Vorschlag oder die Entscheidung zu prüfen.",
    source: "Quelle",
    model: "Modell",
    loading: "Private Vorschläge werden geladen…",
  },
  fr: {
    title: "Le contrôle humain à chaque étape.",
    subtitle:
      "Transformez une situation en exercice de préparation vérifié. Vos plans sont privés et liés à votre compte.",
    simulation: "Simulation uniquement",
    boundary:
      "L’approbation enregistre l’accusé de réception d’un intervenant simulé. Elle ne contacte pas les secours, n’émet pas d’alerte et ne certifie aucun itinéraire sûr.",
    form: "Créer une proposition d’intervention",
    name: "Titre de la situation",
    context: "Que se passe-t-il ?",
    hint: "Décrivez un exercice avec des détails fictifs. N’incluez ni dossiers médicaux ni identifiants personnels.",
    create: "Générer la proposition",
    working: "Traitement…",
    empty:
      "Aucune proposition. Créez un exercice pour examiner le plan de l’assistant.",
    proposed: "En attente de votre décision",
    approved: "Approuvé · simulation terminée",
    rejected: "Rejeté · aucune action",
    approve: "Approuver la simulation",
    reject: "Rejeter la proposition",
    receipt: "Résultat enregistré",
    completed:
      "L’intervenant simulé a confirmé le plan approuvé. Aucune action externe n’a été effectuée.",
    notExecuted: "La proposition a été rejetée et n’a pas été exécutée.",
    refresh: "Actualiser",
    error:
      "Actualisez pour vérifier la proposition ou la décision enregistrée.",
    source: "Source",
    model: "Modèle",
    loading: "Chargement de vos propositions privées…",
  },
};
