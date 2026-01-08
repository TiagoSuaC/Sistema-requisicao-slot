"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { getMacroPeriodByToken, submitDoctorResponse, exportMacroPeriodCalendar } from "@/lib/api";
import type {
  MacroPeriodPublicView,
  MacroPeriodSelection,
  MacroPeriodUnit,
  PartOfDay,
} from "@/lib/types";

export default function DoctorResponsePage() {
  const params = useParams();
  const token = params.token as string;
  const [macroPeriod, setMacroPeriod] = useState<MacroPeriodPublicView | null>(null);
  const [selections, setSelections] = useState<MacroPeriodSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUnitId, setActiveUnitId] = useState<number | null>(null);

  // Block selection mode
  const [blockDates, setBlockDates] = useState<Date[]>([]);
  const [currentUnit, setCurrentUnit] = useState<MacroPeriodUnit | null>(null);

  // Period configuration modal
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodConfigs, setPeriodConfigs] = useState<{[key: string]: {part_of_day: PartOfDay, custom_start?: string, custom_end?: string}}>({});
  const [markAllFullDay, setMarkAllFullDay] = useState(true);

  // Edit individual day modal
  const [editingSelection, setEditingSelection] = useState<MacroPeriodSelection | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Conflict detection
  const [conflicts, setConflicts] = useState<{date: string, message: string}[]>([]);
  const [pendingConflicts, setPendingConflicts] = useState<{date: string, message: string}[]>([]);

  // Responsive calendar months
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // 640px is Tailwind's 'sm' breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, [token]);

  // Check conflicts whenever selections change
  useEffect(() => {
    if (selections.length > 0 && macroPeriod) {
      checkConflicts(selections);
    } else {
      setConflicts([]);
    }
  }, [selections, macroPeriod]);

  // Check pending conflicts whenever period configs change
  useEffect(() => {
    if (showPeriodModal && currentUnit && blockDates.length > 0) {
      checkPendingConflicts();
    }
  }, [periodConfigs, showPeriodModal, currentUnit, blockDates, selections, macroPeriod]);

  const loadData = async () => {
    try {
      const data = await getMacroPeriodByToken(token);
      setMacroPeriod(data);
      setSelections(data.selections || []);
      // Set first unit as active by default
      if (data.units && data.units.length > 0) {
        setActiveUnitId(data.units[0].id);
      }
    } catch (error) {
      alert("Link inválido ou expirado");
    } finally {
      setLoading(false);
    }
  };

  const startBlockSelection = (unit: MacroPeriodUnit) => {
    setCurrentUnit(unit);
  };

  const handleDayClick = (date: Date) => {
    if (!macroPeriod || !currentUnit) return;

    // Normalize dates
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(macroPeriod.start_date + "T00:00:00");
    const startNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const end = new Date(macroPeriod.end_date + "T00:00:00");
    const endNormalized = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    // Check if date is within range
    if (clickedDate < startNormalized || clickedDate > endNormalized) {
      alert("Essa data está fora do período permitido");
      return;
    }

    // Check if can edit
    if (!macroPeriod.can_edit) {
      alert("Este período está bloqueado para edição");
      return;
    }

    // Generate consecutive dates
    const consecutiveDates: Date[] = [];

    for (let i = 0; i < currentUnit.total_days; i++) {
      const d = new Date(clickedDate);
      d.setDate(d.getDate() + i);
      consecutiveDates.push(d);
    }

    // Validate all dates are within period
    for (const d of consecutiveDates) {
      if (d < startNormalized || d > endNormalized) {
        alert("O bloco ultrapassa o período permitido. Escolha uma data inicial anterior.");
        return;
      }
    }

    // Note: We now allow multiple shifts per day (morning + afternoon in different units)
    // Backend will validate time overlaps

    setBlockDates(consecutiveDates);

    // Initialize period configs with FULL_DAY for all dates
    const initialConfigs: {[key: string]: {part_of_day: PartOfDay, custom_start?: string, custom_end?: string}} = {};
    consecutiveDates.forEach(date => {
      const dateStr = date.toISOString().split("T")[0];
      initialConfigs[dateStr] = { part_of_day: "FULL_DAY" };
    });
    setPeriodConfigs(initialConfigs);
    setMarkAllFullDay(true);
    setShowPeriodModal(true);
  };

  const confirmBlockOrder = () => {
    if (!currentUnit || blockDates.length === 0) return;

    // Don't allow if there are pending conflicts
    if (pendingConflicts.length > 0) {
      return;
    }

    const blockId = crypto.randomUUID();
    const newSelections: MacroPeriodSelection[] = [];

    blockDates.forEach((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const config = periodConfigs[dateStr] || { part_of_day: "FULL_DAY" };

      newSelections.push({
        macro_period_unit_id: currentUnit.id,
        date: dateStr,
        part_of_day: config.part_of_day,
        custom_start: config.custom_start,
        custom_end: config.custom_end,
        block_id: blockId
      });
    });

    setSelections([...selections, ...newSelections]);
    setBlockDates([]);
    setCurrentUnit(null);
    setShowPeriodModal(false);
    setPeriodConfigs({});
    setPendingConflicts([]);
  };

  const cancelBlockSelection = () => {
    setBlockDates([]);
    setCurrentUnit(null);
    setShowPeriodModal(false);
    setPeriodConfigs({});
    setMarkAllFullDay(true);
    setPendingConflicts([]);
  };

  const handleMarkAllFullDay = (checked: boolean) => {
    if (checked) {
      // Check if marking all as FULL_DAY would cause conflicts
      const newConfigs = {...periodConfigs};
      blockDates.forEach(date => {
        const dateStr = date.toISOString().split("T")[0];
        newConfigs[dateStr] = { part_of_day: "FULL_DAY" };
      });

      // Temporarily set the configs to check conflicts
      setPeriodConfigs(newConfigs);
      setMarkAllFullDay(true);

      // The useEffect will trigger checkPendingConflicts
    } else {
      setMarkAllFullDay(false);
      setPendingConflicts([]);
    }
  };

  const handlePeriodChange = (dateStr: string, part_of_day: PartOfDay) => {
    setPeriodConfigs({
      ...periodConfigs,
      [dateStr]: {
        part_of_day,
        custom_start: part_of_day === "CUSTOM" ? periodConfigs[dateStr]?.custom_start : undefined,
        custom_end: part_of_day === "CUSTOM" ? periodConfigs[dateStr]?.custom_end : undefined
      }
    });
    // If user manually changes, uncheck "mark all"
    if (markAllFullDay) {
      setMarkAllFullDay(false);
    }
  };

  const handleCustomTimeChange = (dateStr: string, field: 'custom_start' | 'custom_end', value: string) => {
    setPeriodConfigs({
      ...periodConfigs,
      [dateStr]: {
        ...periodConfigs[dateStr],
        [field]: value
      }
    });
  };

  const startEditingSelection = (selection: MacroPeriodSelection) => {
    if (!macroPeriod?.can_edit) {
      alert("Este período está bloqueado para edição");
      return;
    }
    setEditingSelection({...selection});
    setShowEditModal(true);
  };

  const cancelEditSelection = () => {
    setEditingSelection(null);
    setShowEditModal(false);
  };

  const saveEditSelection = () => {
    if (!editingSelection) return;

    // Update the selection in the selections array
    setSelections(selections.map(s =>
      s.id === editingSelection.id ||
      (s.date === editingSelection.date && s.macro_period_unit_id === editingSelection.macro_period_unit_id && s.block_id === editingSelection.block_id)
        ? editingSelection
        : s
    ));

    setEditingSelection(null);
    setShowEditModal(false);
  };

  // Pure function to calculate conflicts without side effects
  const calculateConflicts = (selectionsToCheck: MacroPeriodSelection[]) => {
    const detectedConflicts: {date: string, message: string}[] = [];

    // Group by date
    const byDate: { [date: string]: MacroPeriodSelection[] } = {};
    selectionsToCheck.forEach(sel => {
      if (!byDate[sel.date]) byDate[sel.date] = [];
      byDate[sel.date].push(sel);
    });

    // Check each date
    for (const [date, daySelections] of Object.entries(byDate)) {
      const periods = daySelections.map(s => s.part_of_day);

      // Check for FULL_DAY conflicts
      if (periods.includes("FULL_DAY") && periods.length > 1) {
        // Get all FULL_DAY selections
        const fullDaySelections = daySelections.filter(s => s.part_of_day === "FULL_DAY");

        if (fullDaySelections.length > 1) {
          // Multiple FULL_DAY on same date
          const units = fullDaySelections
            .map(s => macroPeriod?.units.find(u => u.id === s.macro_period_unit_id)?.unit_name)
            .filter(Boolean);
          detectedConflicts.push({
            date,
            message: `Dia Inteiro duplicado em: ${units.join(", ")}`
          });
        }

        // Get periods that are NOT FULL_DAY
        const otherPeriods = daySelections.filter(s => s.part_of_day !== "FULL_DAY");
        if (fullDaySelections.length > 0 && otherPeriods.length > 0) {
          // FULL_DAY + other period type
          const fullDayUnit = macroPeriod?.units.find(u => u.id === fullDaySelections[0].macro_period_unit_id)?.unit_name;
          otherPeriods.forEach(other => {
            const otherUnit = macroPeriod?.units.find(u => u.id === other.macro_period_unit_id);
            detectedConflicts.push({
              date,
              message: `Dia Inteiro em ${fullDayUnit} conflita com ${getPeriodLabel(other)} em ${otherUnit?.unit_name}`
            });
          });
        }
      }

      // Count duplicate periods (excluding CUSTOM and FULL_DAY which was already checked)
      const periodCounts: { [key: string]: number } = {};
      periods.forEach(p => {
        if (p !== "CUSTOM" && p !== "FULL_DAY") {
          periodCounts[p] = (periodCounts[p] || 0) + 1;
        }
      });

      for (const [period, count] of Object.entries(periodCounts)) {
        if (count > 1) {
          const duplicateUnits = daySelections
            .filter(s => s.part_of_day === period)
            .map(s => macroPeriod?.units.find(u => u.id === s.macro_period_unit_id)?.unit_name)
            .filter(Boolean);

          detectedConflicts.push({
            date,
            message: `${period === "MORNING" ? "Manhã" : "Tarde"} duplicada em: ${duplicateUnits.join(", ")}`
          });
        }
      }
    }

    return detectedConflicts;
  };

  const checkConflicts = (selectionsToCheck: MacroPeriodSelection[]) => {
    const detectedConflicts = calculateConflicts(selectionsToCheck);
    setConflicts(detectedConflicts);
    return detectedConflicts;
  };

  const getAvailablePeriodsForDate = (dateStr: string, currentUnitId: number) => {
    // Get existing selections for this date from OTHER units
    const existingSelections = selections.filter(
      s => s.date === dateStr && s.macro_period_unit_id !== currentUnitId
    );

    if (existingSelections.length === 0) {
      return ["FULL_DAY", "MORNING", "AFTERNOON", "CUSTOM"];
    }

    const existingPeriods = existingSelections.map(s => s.part_of_day);

    // If there's FULL_DAY in another unit, nothing is available
    if (existingPeriods.includes("FULL_DAY")) {
      return [];
    }

    const available: PartOfDay[] = [];

    // MORNING is available if not taken
    if (!existingPeriods.includes("MORNING")) {
      available.push("MORNING");
    }

    // AFTERNOON is available if not taken
    if (!existingPeriods.includes("AFTERNOON")) {
      available.push("AFTERNOON");
    }

    // CUSTOM might be available depending on times (simplified: allow if MORNING or AFTERNOON available)
    if (available.length > 0) {
      available.push("CUSTOM");
    }

    return available;
  };

  const checkPendingConflicts = () => {
    if (!currentUnit || blockDates.length === 0) {
      setPendingConflicts([]);
      return [];
    }

    // Simulate adding the new selections
    const simulatedSelections: MacroPeriodSelection[] = [];

    blockDates.forEach((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const config = periodConfigs[dateStr] || { part_of_day: "FULL_DAY" };

      simulatedSelections.push({
        macro_period_unit_id: currentUnit.id,
        date: dateStr,
        part_of_day: config.part_of_day,
        custom_start: config.custom_start,
        custom_end: config.custom_end,
        block_id: 'temp'
      });
    });

    // Check conflicts with existing selections using pure function
    const allSelections = [...selections, ...simulatedSelections];
    const detectedConflicts = calculateConflicts(allSelections);

    setPendingConflicts(detectedConflicts);
    return detectedConflicts;
  };

  const removeBlock = (blockId: string) => {
    if (!macroPeriod?.can_edit) {
      alert("Este período está bloqueado para edição");
      return;
    }
    setSelections(selections.filter(s => s.block_id !== blockId));
  };

  const getSelectionsForUnit = (unitId: number) => {
    const unitSelections = selections.filter(s => s.macro_period_unit_id === unitId);

    // Group by block_id
    const blocks: { [key: string]: MacroPeriodSelection[] } = {};
    const standalone: MacroPeriodSelection[] = [];

    unitSelections.forEach(sel => {
      if (sel.block_id) {
        if (!blocks[sel.block_id]) blocks[sel.block_id] = [];
        blocks[sel.block_id].push(sel);
      } else {
        standalone.push(sel);
      }
    });

    return { blocks, standalone };
  };

  const getPeriodBadge = (selection: MacroPeriodSelection) => {
    switch (selection.part_of_day) {
      case "FULL_DAY":
        return "⏰";
      case "MORNING":
        return "🌅";
      case "AFTERNOON":
        return "🌆";
      case "CUSTOM":
        return "🕐";
      default:
        return "⏰";
    }
  };

  const getPeriodLabel = (selection: MacroPeriodSelection) => {
    switch (selection.part_of_day) {
      case "FULL_DAY":
        return "Dia Inteiro";
      case "MORNING":
        return "Manhã";
      case "AFTERNOON":
        return "Tarde";
      case "CUSTOM":
        return `${selection.custom_start || ''} - ${selection.custom_end || ''}`;
      default:
        return "Dia Inteiro";
    }
  };

  const handleSubmit = async (confirmSubmit: boolean) => {
    if (!macroPeriod?.can_edit) {
      alert("Este período está bloqueado para edição");
      return;
    }

    if (selections.length === 0) {
      alert("Adicione pelo menos uma seleção antes de salvar");
      return;
    }

    // Validate that all units have correct number of days
    for (const unit of macroPeriod.units) {
      const unitSelections = selections.filter(s => s.macro_period_unit_id === unit.id);
      // Count unique days
      const uniqueDays = new Set(unitSelections.map(s => s.date)).size;

      if (uniqueDays !== unit.total_days) {
        alert(`${unit.unit_name} requer ${unit.total_days} dias, mas você selecionou ${uniqueDays}`);
        return;
      }
    }

    // If confirming, show review modal instead of simple confirm
    if (confirmSubmit) {
      setShowConfirmModal(true);
      return;
    }

    // If just saving draft, proceed directly
    await executeSubmit(confirmSubmit);
  };

  const executeSubmit = async (confirmSubmit: boolean) => {
    try {
      const selectionsToSend = selections.map(s => ({
        macro_period_unit_id: s.macro_period_unit_id!,
        date: s.date,
        part_of_day: s.part_of_day,
        custom_start: s.custom_start || null,
        custom_end: s.custom_end || null,
        block_id: s.block_id || null
      }));

      await submitDoctorResponse(token, selectionsToSend, confirmSubmit);

      if (confirmSubmit) {
        alert("Disponibilidade confirmada com sucesso!");
      } else {
        alert("Rascunho salvo com sucesso!");
      }

      setShowConfirmModal(false);
      loadData();
    } catch (error: any) {
      alert("Erro ao enviar: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleExportCalendar = async () => {
    try {
      const blob = await exportMacroPeriodCalendar(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agenda_${macroPeriod?.doctor_name.replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert("Erro ao exportar calendário: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddToGoogleCalendar = async () => {
    try {
      // Download the .ics file first
      const blob = await exportMacroPeriodCalendar(token);
      const url = window.URL.createObjectURL(blob);

      // Open Google Calendar import page
      window.open('https://calendar.google.com/calendar/r/settings/export', '_blank');

      // Also trigger download so user can import
      const a = document.createElement("a");
      a.href = url;
      a.download = `agenda_${macroPeriod?.doctor_name.replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show instructions
      setTimeout(() => {
        alert('Arquivo baixado! Na página do Google Calendar que abriu, clique em "Importar" no menu lateral e selecione o arquivo baixado.');
      }, 500);
    } catch (error: any) {
      alert("Erro ao exportar calendário: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddToIPhone = () => {
    // Get base URL
    const baseUrl = window.location.origin;
    // Convert http:// to webcal:// for iPhone Calendar
    const webcalUrl = baseUrl.replace('http://', 'webcal://').replace('https://', 'webcal://');
    const feedUrl = `${webcalUrl}/api/public/macro-period/${token}/calendar-feed`;

    // Open the webcal link - iOS will automatically open in Calendar app
    window.location.href = feedUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!macroPeriod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Link inválido ou expirado
      </div>
    );
  }

  const startDate = new Date(macroPeriod.start_date + "T00:00:00");
  const endDate = new Date(macroPeriod.end_date + "T00:00:00");

  // Calculate number of months to show (1 on mobile, 1-2 on desktop)
  const numberOfMonths = isMobile
    ? 1
    : (startDate.getMonth() !== endDate.getMonth() ||
       startDate.getFullYear() !== endDate.getFullYear())
      ? 2
      : 1;

  const activeUnit = macroPeriod.units.find(u => u.id === activeUnitId);
  const allSelectedDates = selections.map((s) => new Date(s.date + "T00:00:00"));

  // Color palette for units
  const unitColors = [
    {
      bg: 'bg-blue-400',
      border: 'border-blue-400',
      text: 'text-blue-800',
      badge: 'bg-blue-100',
      hex: '#60a5fa'
    },
    {
      bg: 'bg-green-400',
      border: 'border-green-400',
      text: 'text-green-800',
      badge: 'bg-green-100',
      hex: '#4ade80'
    },
    {
      bg: 'bg-orange-400',
      border: 'border-orange-400',
      text: 'text-orange-800',
      badge: 'bg-orange-100',
      hex: '#fb923c'
    },
    {
      bg: 'bg-purple-400',
      border: 'border-purple-400',
      text: 'text-purple-800',
      badge: 'bg-purple-100',
      hex: '#c084fc'
    },
    {
      bg: 'bg-pink-400',
      border: 'border-pink-400',
      text: 'text-pink-800',
      badge: 'bg-pink-100',
      hex: '#f472b6'
    },
    {
      bg: 'bg-indigo-400',
      border: 'border-indigo-400',
      text: 'text-indigo-800',
      badge: 'bg-indigo-100',
      hex: '#818cf8'
    },
  ];

  const getUnitColor = (unitId: number) => {
    const unitIndex = macroPeriod.units.findIndex(u => u.id === unitId);
    return unitColors[unitIndex % unitColors.length];
  };

  // Group selections by unit for calendar modifiers
  const selectionsByUnit: { [unitId: number]: Date[] } = {};

  // Detect days with split (morning in one unit, afternoon in another)
  type SplitConfig = { morningUnitId?: number; afternoonUnitId?: number };
  const splitDayConfigs: { [date: string]: SplitConfig } = {};

  selections.forEach(sel => {
    // Track by date for split detection
    if (!splitDayConfigs[sel.date]) {
      splitDayConfigs[sel.date] = {};
    }

    if (sel.part_of_day === "MORNING") {
      splitDayConfigs[sel.date].morningUnitId = sel.macro_period_unit_id;
    } else if (sel.part_of_day === "AFTERNOON") {
      splitDayConfigs[sel.date].afternoonUnitId = sel.macro_period_unit_id;
    }
  });

  // Identify actual split days (morning and afternoon in DIFFERENT units)
  const splitDays: { [splitKey: string]: Date[] } = {};
  const datesWithSplit = new Set<string>();

  Object.entries(splitDayConfigs).forEach(([dateStr, config]) => {
    if (
      config.morningUnitId &&
      config.afternoonUnitId &&
      config.morningUnitId !== config.afternoonUnitId
    ) {
      const splitKey = `split-morning-${config.morningUnitId}-afternoon-${config.afternoonUnitId}`;
      if (!splitDays[splitKey]) splitDays[splitKey] = [];
      splitDays[splitKey].push(new Date(dateStr + "T00:00:00"));
      datesWithSplit.add(dateStr);
    }
  });

  // Group by unit (excluding split days)
  selections.forEach(sel => {
    // Skip if this date has a split (will be handled separately)
    if (datesWithSplit.has(sel.date)) return;

    if (!selectionsByUnit[sel.macro_period_unit_id!]) {
      selectionsByUnit[sel.macro_period_unit_id!] = [];
    }

    // Only add if not already added for this date
    const dateObj = new Date(sel.date + "T00:00:00");
    const alreadyAdded = selectionsByUnit[sel.macro_period_unit_id!].some(
      d => d.getTime() === dateObj.getTime()
    );

    if (!alreadyAdded) {
      selectionsByUnit[sel.macro_period_unit_id!].push(dateObj);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">
            Disponibilidade de Atendimento
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-500">
                Médico
              </label>
              <p className="text-base sm:text-lg font-medium">{macroPeriod.doctor_name}</p>
            </div>
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-500">
                Período
              </label>
              <p className="text-base sm:text-lg font-medium">
                {new Date(macroPeriod.start_date).toLocaleDateString("pt-BR")} -{" "}
                {new Date(macroPeriod.end_date).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Status Banner */}
          {macroPeriod.can_edit ? (
            <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">✅</span>
                <div>
                  <p className="font-semibold text-green-800 text-base sm:text-lg">Você pode editar livremente</p>
                  <p className="text-sm sm:text-base text-green-700 mt-1">
                    Selecione suas datas e salve como rascunho quantas vezes precisar.
                    Quando estiver pronto, clique em "Confirmar e Enviar" para finalizar.
                  </p>
                </div>
              </div>
            </div>
          ) : macroPeriod.status === "RESPONDIDO" ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">⏳</span>
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-800 text-base sm:text-lg">Aguardando aprovação</p>
                    <p className="text-sm sm:text-base text-yellow-700 mt-1">
                      Sua disponibilidade foi enviada e está aguardando aprovação do administrador.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToGoogleCalendar}
                    disabled={selections.length === 0}
                    className="w-full bg-blue-600 text-white py-4 sm:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-base flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <span className="text-xl">📅</span>
                    <span>Google Calendar</span>
                  </button>
                  <button
                    onClick={handleAddToIPhone}
                    disabled={selections.length === 0}
                    className="w-full bg-gray-800 text-white py-4 sm:py-3 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-base flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <span className="text-xl">🍎</span>
                    <span>iPhone / Apple</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 text-center mt-2">
                  Clique no botão da sua plataforma para adicionar automaticamente à sua agenda
                </p>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">🔒</span>
                <div>
                  <p className="font-semibold text-gray-800 text-base sm:text-lg">Período bloqueado</p>
                  <p className="text-sm sm:text-base text-gray-700 mt-1">
                    Este período foi confirmado e não pode mais ser editado.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg">
            <p className="text-sm sm:text-base text-blue-800">
              <strong>Instruções:</strong> Selecione blocos consecutivos de dias para cada unidade.
              O sistema irá agrupar os dias automaticamente.
            </p>
          </div>
        </div>

        {/* Unit Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-4 sm:mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex min-w-full">
              {macroPeriod.units.map((unit) => {
                const unitSelections = selections.filter(s => s.macro_period_unit_id === unit.id);
                const uniqueDays = new Set(unitSelections.map(s => s.date)).size;
                const isComplete = uniqueDays === unit.total_days;

                return (
                  <button
                    key={unit.id}
                    onClick={() => setActiveUnitId(unit.id)}
                    className={`flex-1 min-w-[140px] py-3 sm:py-4 px-3 sm:px-4 text-center border-b-2 font-medium text-sm sm:text-base touch-manipulation ${
                      activeUnitId === unit.id
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold">{unit.unit_name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{unit.unit_city}</div>
                    <div className="mt-1.5">
                      <span className={`inline-block px-2 py-1 rounded text-xs sm:text-sm font-medium ${
                        isComplete ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {uniqueDays}/{unit.total_days} {unit.total_days === 1 ? 'dia' : 'dias'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {activeUnit && (
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold mb-2">{activeUnit.unit_name}</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Selecione <strong>{activeUnit.total_days} {activeUnit.total_days === 1 ? 'dia' : 'dias'} consecutivos</strong>
                </p>

                <button
                  onClick={() => startBlockSelection(activeUnit)}
                  disabled={!macroPeriod.can_edit}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base sm:text-sm touch-manipulation"
                >
                  📅 Selecionar Bloco ({activeUnit.total_days} {activeUnit.total_days === 1 ? 'dia' : 'dias'})
                </button>
              </div>

              {/* Units Legend */}
              <div className="mb-4 p-3 sm:p-4 bg-gray-50 border rounded-lg">
                <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-3">Legenda das Unidades:</h4>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {macroPeriod.units.map((unit) => {
                    const color = getUnitColor(unit.id);
                    const unitSelections = selections.filter(s => s.macro_period_unit_id === unit.id);
                    const uniqueDays = new Set(unitSelections.map(s => s.date)).size;
                    const isComplete = uniqueDays === unit.total_days;
                    const isActive = unit.id === activeUnitId;

                    return (
                      <div
                        key={unit.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          isActive ? color.border + ' ' + color.badge : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 sm:w-4 sm:h-4 rounded ${color.bg} ${color.border} border-2`}></div>
                        <span className={`text-sm sm:text-sm font-medium ${isActive ? color.text : 'text-gray-700'}`}>
                          {unit.unit_name}
                        </span>
                        <span className={`text-xs sm:text-xs px-2 py-1 rounded font-medium ${
                          isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {uniqueDays}/{unit.total_days}
                          {isComplete && ' ✓'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calendar */}
              <div className="flex justify-center mb-4 sm:mb-6 border rounded p-2 sm:p-4 overflow-x-auto">
                <style dangerouslySetInnerHTML={{
                  __html: `
                    ${macroPeriod.units.map((unit, index) => {
                      const color = unitColors[index % unitColors.length];
                      return `.unit-${unit.id} { background-color: ${color.hex} !important; border-radius: 4px; }`;
                    }).join('\n')}

                    ${Object.keys(splitDays).map(splitKey => {
                      // Parse split key: "split-morning-X-afternoon-Y"
                      const match = splitKey.match(/split-morning-(\d+)-afternoon-(\d+)/);
                      if (!match) return '';

                      const morningUnitId = parseInt(match[1]);
                      const afternoonUnitId = parseInt(match[2]);

                      const morningColor = getUnitColor(morningUnitId).hex;
                      const afternoonColor = getUnitColor(afternoonUnitId).hex;

                      // Gradient: top half (afternoon), bottom half (morning)
                      return `.${splitKey} {
                        background: linear-gradient(to bottom,
                          ${afternoonColor} 0%, ${afternoonColor} 50%,
                          ${morningColor} 50%, ${morningColor} 100%
                        ) !important;
                        border-radius: 4px;
                      }`;
                    }).join('\n')}
                  `
                }} />
                <DayPicker
                  mode="default"
                  numberOfMonths={numberOfMonths}
                  selected={allSelectedDates}
                  onDayClick={handleDayClick}
                  disabled={[
                    { before: startDate, after: endDate },
                    ...(!currentUnit ? [{before: new Date(9999,0,1)}] : [])
                  ]}
                  fromDate={startDate}
                  toDate={endDate}
                  modifiers={{
                    // Regular unit days (no split)
                    ...Object.fromEntries(
                      macroPeriod.units.map(unit => [
                        `unit-${unit.id}`,
                        selectionsByUnit[unit.id] || []
                      ])
                    ),
                    // Split days (morning + afternoon in different units)
                    ...Object.fromEntries(
                      Object.entries(splitDays).map(([splitKey, dates]) => [
                        splitKey,
                        dates
                      ])
                    )
                  }}
                  modifiersClassNames={{
                    // Regular unit days
                    ...Object.fromEntries(
                      macroPeriod.units.map(unit => [
                        `unit-${unit.id}`,
                        `unit-${unit.id}`
                      ])
                    ),
                    // Split days
                    ...Object.fromEntries(
                      Object.keys(splitDays).map(splitKey => [
                        splitKey,
                        splitKey
                      ])
                    )
                  }}
                />
              </div>

              {/* Selections for this unit */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">Blocos Selecionados:</h3>
                {(() => {
                  const { blocks } = getSelectionsForUnit(activeUnit.id);

                  if (Object.keys(blocks).length === 0) {
                    return <p className="text-gray-500 text-sm sm:text-base">Nenhum bloco selecionado ainda</p>;
                  }

                  return (
                    <div className="space-y-3">
                      {Object.entries(blocks).map(([blockId, blockSelections]) => {
                        const sorted = blockSelections.sort((a, b) => a.date.localeCompare(b.date));
                        const totalDays = sorted.length;
                        const firstDate = new Date(sorted[0].date + "T00:00:00");
                        const lastDate = new Date(sorted[sorted.length - 1].date + "T00:00:00");

                        return (
                          <div key={blockId} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <span className="font-medium text-sm sm:text-base">
                                  {firstDate.toLocaleDateString("pt-BR")} → {lastDate.toLocaleDateString("pt-BR")}
                                </span>
                                <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-600">
                                  ({totalDays} {totalDays === 1 ? 'dia' : 'dias'})
                                </span>
                              </div>
                              {macroPeriod.can_edit && (
                                <button
                                  onClick={() => removeBlock(blockId)}
                                  className="text-red-600 hover:text-red-800 text-sm sm:text-base font-medium ml-2 px-2 py-1 touch-manipulation"
                                >
                                  Remover
                                </button>
                              )}
                            </div>

                            {/* Show periods for each day */}
                            <div className="flex flex-wrap gap-2">
                              {sorted.map((sel, idx) => (
                                <div key={idx} className="text-xs sm:text-sm bg-white border rounded px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2">
                                  <span className="text-base">{getPeriodBadge(sel)}</span>
                                  <span className="text-gray-600 font-medium">
                                    {new Date(sel.date + "T00:00:00").toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                                  </span>
                                  <span className="text-gray-500">
                                    {getPeriodLabel(sel)}
                                  </span>
                                  {macroPeriod.can_edit && (
                                    <button
                                      onClick={() => startEditingSelection(sel)}
                                      className="text-blue-600 hover:text-blue-800 ml-1 text-base touch-manipulation p-1"
                                      title="Editar período"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Conflicts Warning Banner */}
        {macroPeriod.can_edit && conflicts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-red-900 font-bold text-base sm:text-lg mb-2">
                  {conflicts.length} {conflicts.length === 1 ? 'Conflito Detectado' : 'Conflitos Detectados'}
                </h3>
                <div className="space-y-1 mb-3">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="text-sm sm:text-base text-red-800">
                      • <strong>{new Date(conflict.date + "T00:00:00").toLocaleDateString("pt-BR")}</strong>: {conflict.message}
                    </div>
                  ))}
                </div>
                <p className="text-sm sm:text-base text-red-700 font-medium">
                  Você não pode estar em dois lugares ao mesmo tempo. Corrija os conflitos antes de salvar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        {macroPeriod.can_edit && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={selections.length === 0 || conflicts.length > 0}
                className="flex-1 bg-blue-600 text-white py-4 sm:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-base flex items-center justify-center gap-2 touch-manipulation"
                title={conflicts.length > 0 ? "Corrija os conflitos antes de salvar" : "Salva suas seleções sem enviar para aprovação. Você poderá continuar editando depois."}
              >
                <span className="text-xl">💾</span>
                <span>Salvar Rascunho</span>
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={selections.length === 0 || conflicts.length > 0}
                className="flex-1 bg-green-600 text-white py-4 sm:py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-base flex items-center justify-center gap-2 touch-manipulation"
                title={conflicts.length > 0 ? "Corrija os conflitos antes de confirmar" : "Confirma e envia sua disponibilidade para o administrador. Você não poderá mais editar após confirmar."}
              >
                <span className="text-xl">✅</span>
                <span>Confirmar e Enviar</span>
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-500 text-center mt-3 sm:mt-4">
              {conflicts.length > 0
                ? "⚠️ Corrija os conflitos acima para continuar"
                : "💡 Dica: Use \"Salvar Rascunho\" para guardar seu progresso sem finalizar"
              }
            </p>
          </div>
        )}

        {/* Period Configuration Modal */}
        {showPeriodModal && currentUnit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 sm:p-4">
            <div className="bg-white sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                  📅 Configurar Períodos do Bloco
                </h2>

                <div className="mb-4 text-sm sm:text-base text-gray-600">
                  <strong>{currentUnit.unit_name}</strong> - {blockDates.length} {blockDates.length === 1 ? 'dia' : 'dias'}
                </div>

                {/* Quick option: Mark all as Full Day */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <label className="flex items-start cursor-pointer touch-manipulation">
                    <input
                      type="checkbox"
                      checked={markAllFullDay}
                      onChange={(e) => handleMarkAllFullDay(e.target.checked)}
                      className="mt-1 mr-3 w-5 h-5 sm:w-4 sm:h-4"
                    />
                    <div>
                      <div className="font-semibold text-blue-900 text-base sm:text-base">⚡ Marcar todos como Dia Inteiro</div>
                      <div className="text-sm sm:text-sm text-blue-700 mt-1">
                        Opção mais comum - você pode alterar individualmente abaixo se necessário
                      </div>
                    </div>
                  </label>
                </div>

                {/* Individual configuration */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-3">
                    ▼ Configuração Individual {!markAllFullDay && '(ativa)'}
                  </h3>

                  <div className="space-y-3">
                    {blockDates.map((date) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const config = periodConfigs[dateStr] || { part_of_day: "FULL_DAY" };

                      return (
                        <div key={dateStr} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                          {(() => {
                            const availablePeriods = getAvailablePeriodsForDate(dateStr, currentUnit.id);
                            const existingInOtherUnits = selections.filter(
                              s => s.date === dateStr && s.macro_period_unit_id !== currentUnit.id
                            );

                            return (
                              <>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                  <div className="text-sm sm:text-base font-medium text-gray-700 sm:w-24">
                                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </div>

                                  <select
                                    value={config.part_of_day}
                                    onChange={(e) => handlePeriodChange(dateStr, e.target.value as PartOfDay)}
                                    disabled={markAllFullDay}
                                    className="w-full sm:flex-1 rounded-md border-gray-300 shadow-sm px-3 py-2.5 sm:py-2 border text-base sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed touch-manipulation"
                                  >
                                    <option value="FULL_DAY" disabled={!availablePeriods.includes("FULL_DAY")}>
                                      ⏰ Dia Inteiro {!availablePeriods.includes("FULL_DAY") && "(indisponível)"}
                                    </option>
                                    <option value="MORNING" disabled={!availablePeriods.includes("MORNING")}>
                                      🌅 Manhã {!availablePeriods.includes("MORNING") && "(indisponível)"}
                                    </option>
                                    <option value="AFTERNOON" disabled={!availablePeriods.includes("AFTERNOON")}>
                                      🌆 Tarde {!availablePeriods.includes("AFTERNOON") && "(indisponível)"}
                                    </option>
                                    <option value="CUSTOM" disabled={!availablePeriods.includes("CUSTOM")}>
                                      🕐 Personalizado {!availablePeriods.includes("CUSTOM") && "(indisponível)"}
                                    </option>
                                  </select>
                                </div>

                                {/* Show warning about existing allocations */}
                                {existingInOtherUnits.length > 0 && !markAllFullDay && (
                                  <div className="mt-2 ml-24 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                    <span className="font-semibold text-yellow-800">⚠️ Atenção:</span>
                                    <span className="text-yellow-700 ml-1">
                                      {existingInOtherUnits.map((sel, idx) => {
                                        const unit = macroPeriod?.units.find(u => u.id === sel.macro_period_unit_id);
                                        return `${idx > 0 ? ', ' : ''}${getPeriodLabel(sel)} em ${unit?.unit_name}`;
                                      }).join('')}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {/* Show shift reference */}
                          {!markAllFullDay && config.part_of_day !== "CUSTOM" && currentUnit.config_turnos && (
                            <div className="mt-2 text-xs text-gray-500 ml-24">
                              {config.part_of_day === "MORNING" && `Ref: ${currentUnit.config_turnos.morning.start} - ${currentUnit.config_turnos.morning.end}`}
                              {config.part_of_day === "AFTERNOON" && `Ref: ${currentUnit.config_turnos.afternoon.start} - ${currentUnit.config_turnos.afternoon.end}`}
                            </div>
                          )}

                          {/* Custom time fields */}
                          {!markAllFullDay && config.part_of_day === "CUSTOM" && (
                            <div className="mt-3 sm:ml-24 flex gap-3 items-center">
                              <div className="flex-1">
                                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Início</label>
                                <input
                                  type="time"
                                  value={config.custom_start || ""}
                                  onChange={(e) => handleCustomTimeChange(dateStr, 'custom_start', e.target.value)}
                                  className="w-full rounded-md border-gray-300 shadow-sm px-2 py-2 sm:py-1 border text-base sm:text-sm touch-manipulation"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Fim</label>
                                <input
                                  type="time"
                                  value={config.custom_end || ""}
                                  onChange={(e) => handleCustomTimeChange(dateStr, 'custom_end', e.target.value)}
                                  className="w-full rounded-md border-gray-300 shadow-sm px-2 py-2 sm:py-1 border text-base sm:text-sm touch-manipulation"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pending Conflicts Warning */}
                {pendingConflicts.length > 0 && (
                  <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-300 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-xl sm:text-lg">⚠️</span>
                      <div className="flex-1">
                        <h4 className="text-red-900 font-bold text-sm sm:text-base mb-1">
                          CONFLITO: Estas configurações conflitam com seleções existentes
                        </h4>
                        <div className="space-y-1">
                          {pendingConflicts.map((conflict, idx) => (
                            <div key={idx} className="text-xs sm:text-sm text-red-800">
                              • <strong>{new Date(conflict.date + "T00:00:00").toLocaleDateString("pt-BR")}</strong>: {conflict.message}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs sm:text-sm text-red-700 mt-2">
                          {markAllFullDay
                            ? "Desmarque 'Dia Inteiro para todos' e configure individualmente."
                            : "Altere os períodos antes de confirmar."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t mt-4">
                  <button
                    onClick={cancelBlockSelection}
                    className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm text-gray-700 hover:bg-gray-50 font-medium touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmBlockOrder}
                    disabled={pendingConflicts.length > 0}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-sm touch-manipulation"
                    title={pendingConflicts.length > 0 ? "Corrija os conflitos antes de confirmar" : "Confirmar e adicionar bloco"}
                  >
                    ✅ Confirmar Bloco
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Individual Day Modal */}
        {showEditModal && editingSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold mb-4">
                  ✏️ Editar Período
                </h2>

                <div className="mb-4">
                  <div className="text-sm sm:text-base text-gray-600 mb-3">
                    Data: <strong>{new Date(editingSelection.date + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
                  </div>

                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <select
                    value={editingSelection.part_of_day}
                    onChange={(e) => setEditingSelection({
                      ...editingSelection,
                      part_of_day: e.target.value as PartOfDay,
                      custom_start: e.target.value === "CUSTOM" ? editingSelection.custom_start : undefined,
                      custom_end: e.target.value === "CUSTOM" ? editingSelection.custom_end : undefined
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2.5 sm:py-2 border text-base sm:text-sm touch-manipulation"
                  >
                    <option value="FULL_DAY">⏰ Dia Inteiro</option>
                    <option value="MORNING">🌅 Manhã</option>
                    <option value="AFTERNOON">🌆 Tarde</option>
                    <option value="CUSTOM">🕐 Personalizado</option>
                  </select>
                </div>

                {editingSelection.part_of_day === "CUSTOM" && (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                        Horário de Início
                      </label>
                      <input
                        type="time"
                        value={editingSelection.custom_start || ""}
                        onChange={(e) => setEditingSelection({
                          ...editingSelection,
                          custom_start: e.target.value
                        })}
                        className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2.5 sm:py-2 border text-base sm:text-sm touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                        Horário de Fim
                      </label>
                      <input
                        type="time"
                        value={editingSelection.custom_end || ""}
                        onChange={(e) => setEditingSelection({
                          ...editingSelection,
                          custom_end: e.target.value
                        })}
                        className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2.5 sm:py-2 border text-base sm:text-sm touch-manipulation"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    onClick={cancelEditSelection}
                    className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm text-gray-700 hover:bg-gray-50 font-medium touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEditSelection}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 font-semibold text-base sm:text-sm touch-manipulation"
                  >
                    💾 Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Review Modal */}
        {showConfirmModal && macroPeriod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                  📋 Revisar Disponibilidade
                </h2>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm sm:text-base text-yellow-800">
                      <strong>Atenção:</strong> Após confirmar, você não poderá mais editar sua disponibilidade.
                      Revise cuidadosamente as informações abaixo antes de confirmar.
                    </p>
                  </div>
                </div>

                {/* Review Table */}
                <div className="border rounded-lg overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Unidade
                          </th>
                          <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Período
                          </th>
                          <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Horário
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selections
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((selection, idx) => {
                            const unit = macroPeriod.units.find(u => u.id === selection.macro_period_unit_id);
                            const date = new Date(selection.date + "T00:00:00");

                            let periodText = "";
                            let horarioText = "-";

                            switch (selection.part_of_day) {
                              case "FULL_DAY":
                                periodText = "Dia Inteiro";
                                break;
                              case "MORNING":
                                periodText = "Manhã";
                                break;
                              case "AFTERNOON":
                                periodText = "Tarde";
                                break;
                              case "CUSTOM":
                                periodText = "Personalizado";
                                horarioText = `${selection.custom_start || ''} - ${selection.custom_end || ''}`;
                                break;
                            }

                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-sm sm:text-base text-gray-900 whitespace-nowrap">
                                  {date.toLocaleDateString("pt-BR")}
                                </td>
                                <td className="px-4 py-3 text-sm sm:text-base text-gray-900">
                                  {unit?.unit_name} - {unit?.unit_city}
                                </td>
                                <td className="px-4 py-3 text-sm sm:text-base text-gray-900">
                                  {periodText}
                                </td>
                                <td className="px-4 py-3 text-sm sm:text-base text-gray-900">
                                  {horarioText}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Resumo</h3>
                  <div className="text-sm sm:text-base text-blue-800">
                    <p>Total de dias selecionados: <strong>{new Set(selections.map(s => s.date)).size}</strong></p>
                    <p>Total de alocações: <strong>{selections.length}</strong></p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm text-gray-700 hover:bg-gray-50 font-medium touch-manipulation"
                  >
                    ← Voltar e Editar
                  </button>
                  <button
                    onClick={() => executeSubmit(true)}
                    className="flex-1 bg-green-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-green-700 font-semibold text-base sm:text-sm touch-manipulation"
                  >
                    ✅ Confirmar e Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
