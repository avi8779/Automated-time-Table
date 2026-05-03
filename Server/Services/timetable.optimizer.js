const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

const DEFAULT_LIMITS = {
  maxBacktrackingNodes: 300000,
  backtrackingTimeMs: 40000,
  maxAttempts: 5,
  annealingIterations: 1500,
  annealingStartTemp: 50,
  annealingCoolingRate: 0.992,
  debugLimit: 300,
  strictRoomCapacity: false,
  roomMode: "flexible",
};

const cloneAssignment = (assignment) => ({ ...assignment });

const key = (day, slotId) => `${day}:${slotId}`;

const randomInt = (max) => Math.floor(Math.random() * max);

const shuffleArray = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const rotateArray = (items, startIndex = 0) => {
  if (!items.length) return [];
  const start = startIndex % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
};

const isConsecutiveSlot = (a, b) => {
  if (!a || !b || a.day !== b.day) return false;
  const endA = new Date(`1970-01-01T${a.end_time}`);
  const startB = new Date(`1970-01-01T${b.start_time}`);
  const diff = (startB - endA) / (1000 * 60);
  return diff >= 0 && diff <= 15;
};

const addDebug = (debugLogs, message, limit) => {
  if (debugLogs.length < limit) debugLogs.push(message);
};

const makeState = (context) => {
  const state = {
    assignments: [],
    teacherBusy: new Map(),
    roomBusy: new Map(),
    sectionBusy: new Map(),
    teacherWeekHours: new Map(),
    teacherDayHours: new Map(),
    sectionDayCount: new Map(),
    subjectDayCount: new Map(),
    subjectDaySessionCount: new Map(),
    labStartCount: new Map(),
    sectionLabAssignedCount: new Map(),
    labAssignedDays: new Map(),
    sectionRoomByType: new Map(),
  };

  for (const teacher of context.teachers) {
    state.teacherWeekHours.set(teacher.teacher_id, 0);
    state.teacherDayHours.set(teacher.teacher_id, new Map());
    for (const day of context.availableDays) {
      state.teacherDayHours.get(teacher.teacher_id).set(day, 0);
    }
  }

  for (const section of context.sections) {
    state.sectionDayCount.set(section.section_id, new Map());
    state.sectionLabAssignedCount.set(section.section_id, 0);
    for (const day of context.availableDays) {
      state.sectionDayCount.get(section.section_id).set(day, 0);
    }
  }

  for (const row of context.existingBusy || []) {
    occupyResource(state.teacherBusy, row.day, row.slot_id, row.teacher_id);
    occupyResource(state.roomBusy, row.day, row.slot_id, row.room_id);
    occupyResource(state.sectionBusy, row.day, row.slot_id, row.section_id);
    incrementTeacherHours(state, row.teacher_id, row.day, 1);
  }

  return state;
};

const cloneState = (state) => ({
  assignments: state.assignments.map(cloneAssignment),
  teacherBusy: cloneMapOfSets(state.teacherBusy),
  roomBusy: cloneMapOfSets(state.roomBusy),
  sectionBusy: cloneMapOfSets(state.sectionBusy),
  teacherWeekHours: new Map(state.teacherWeekHours),
  teacherDayHours: cloneMapOfMaps(state.teacherDayHours),
  sectionDayCount: cloneMapOfMaps(state.sectionDayCount),
  subjectDayCount: cloneMapOfMaps(state.subjectDayCount),
  subjectDaySessionCount: cloneMapOfMaps(state.subjectDaySessionCount),
  labStartCount: cloneMapOfMaps(state.labStartCount),
  sectionLabAssignedCount: new Map(state.sectionLabAssignedCount),
  labAssignedDays: cloneMapOfSets(state.labAssignedDays),
  sectionRoomByType: cloneMapOfMaps(state.sectionRoomByType),
});

const cloneMapOfSets = (source) => {
  const copy = new Map();
  for (const [mapKey, value] of source.entries()) copy.set(mapKey, new Set(value));
  return copy;
};

const cloneMapOfMaps = (source) => {
  const copy = new Map();
  for (const [mapKey, value] of source.entries()) copy.set(mapKey, new Map(value));
  return copy;
};

const occupyResource = (busyMap, day, slotId, id) => {
  const mapKey = key(day, slotId);
  if (!busyMap.has(mapKey)) busyMap.set(mapKey, new Set());
  busyMap.get(mapKey).add(id);
};

const releaseResource = (busyMap, day, slotId, id) => {
  const mapKey = key(day, slotId);
  const bucket = busyMap.get(mapKey);
  if (!bucket) return;
  bucket.delete(id);
  if (bucket.size === 0) busyMap.delete(mapKey);
};

const hasResource = (busyMap, day, slotId, id) => busyMap.get(key(day, slotId))?.has(id);

const incrementTeacherHours = (state, teacherId, day, count) => {
  state.teacherWeekHours.set(teacherId, (state.teacherWeekHours.get(teacherId) || 0) + count);
  if (!state.teacherDayHours.has(teacherId)) state.teacherDayHours.set(teacherId, new Map());
  const dayMap = state.teacherDayHours.get(teacherId);
  dayMap.set(day, (dayMap.get(day) || 0) + count);
};

const incrementNestedCount = (map, firstKey, secondKey, count) => {
  if (!map.has(firstKey)) map.set(firstKey, new Map());
  const nested = map.get(firstKey);
  nested.set(secondKey, (nested.get(secondKey) || 0) + count);
};

const setNestedValue = (map, firstKey, secondKey, value) => {
  if (!map.has(firstKey)) map.set(firstKey, new Map());
  map.get(firstKey).set(secondKey, value);
};

const getNestedCount = (map, firstKey, secondKey) => map.get(firstKey)?.get(secondKey) || 0;

const getSubjectDayKey = (sectionId, subjectId) => `${sectionId}:${subjectId}`;

const maxSubjectSessionsPerDay = (unit, context) => {
  const availableDays = Math.max(context.availableDays.length, 1);
  return Math.max(1, Math.ceil((unit.totalSessions || 1) / availableDays));
};

const getSectionTargetSlotsPerDay = (context, sectionId) => {
  const required = context.sectionRequiredSlotCount.get(sectionId) || 0;
  const days = Math.max(context.availableDays.length, 1);
  return Math.max(1, Math.ceil(required / days));
};

const hasLowerLoadDay = (state, context, sectionId, currentDay) => {
  const currentLoad = getNestedCount(state.sectionDayCount, sectionId, currentDay);
  return context.availableDays.some((day) =>
    getNestedCount(state.sectionDayCount, sectionId, day) < currentLoad
  );
};

const teacherCanTake = (state, teacher, day, duration) => {
  const currentDay = getNestedCount(state.teacherDayHours, teacher.teacher_id, day);
  const currentWeek = state.teacherWeekHours.get(teacher.teacher_id) || 0;
  return (
    currentDay + duration <= (teacher.max_hours_per_day || 6) &&
    currentWeek + duration <= (teacher.max_hours_per_week || 30)
  );
};

const getRoomType = (room) => room?.room_type || "CLASSROOM";

export const validateRoomCapacity = (section, room) => {
  if (room.capacity < section.strength) {
    throw new Error(
      `Room ${room.room_id} capacity (${room.capacity}) is less than section strength (${section.strength})`
    );
  }
};

const getFirstOpenSectionSlotIndex = (state, sectionId, daySlots) =>
  daySlots.findIndex((slot) => !hasResource(state.sectionBusy, slot.day, slot.slot_id, sectionId));

const isPlannedLabDayUsed = (state, sectionId, subjectId, day) =>
  state.labAssignedDays.get(`${sectionId}:${subjectId}`)?.has(day);

/**
 * For a lab unit: find the first open slot index where two consecutive slots
 * are free for this section on the given day.
 * For a theory unit: find the first open slot index (simple no-gap).
 */
const getEffectiveFirstOpenIndex = (state, unit, context, day) => {
  const daySlots = context.slotsByDay[day] || [];

  if (!unit.isLab) {
    return getFirstOpenSectionSlotIndex(state, unit.section_id, daySlots);
  }

  // Lab: need two consecutive free slots
  for (let i = 0; i < daySlots.length - 1; i++) {
    if (hasResource(state.sectionBusy, day, daySlots[i].slot_id, unit.section_id)) continue;
    if (hasResource(state.sectionBusy, day, daySlots[i + 1].slot_id, unit.section_id)) continue;
    if (!isConsecutiveSlot(daySlots[i], daySlots[i + 1])) continue;
    return i;
  }
  return -1;
};

const isNoGapPlacement = (state, unit, placement, context, debugLogs = null) => {
  const day = placement.slots[0].day;
  const daySlots = context.slotsByDay[day] || [];
  const placementIndex = daySlots.findIndex((slot) => slot.slot_id === placement.slots[0].slot_id);

  // Labs are exempt from the strict no-gap position rule — they can start at any
  // valid consecutive free pair, so the stacking penalty can spread them across
  // different times. Only theory classes must fill from the first open slot.
  if (unit.isLab) {
    if (isPlannedLabDayUsed(state, unit.section_id, unit.subject_id, day)) {
      addDebug(
        debugLogs || [],
        `${unit.label} failed at ${day}: section already has a practical/lab block that day`,
        context.options.debugLimit
      );
      return false;
    }

    const secondSlot = daySlots[placementIndex + 1];
    if (!secondSlot || !isConsecutiveSlot(daySlots[placementIndex], secondSlot)) {
      addDebug(debugLogs || [], `${unit.label} failed at ${day}: no consecutive slots available for lab`, context.options.debugLimit);
      return false;
    }

    return true;
  }

  // Theory: enforce no-gap rule (must fill from the first open slot).
  const effectiveFirstOpen = getEffectiveFirstOpenIndex(state, unit, context, day);

  if (effectiveFirstOpen < 0) {
    addDebug(debugLogs || [], `${unit.label} failed at ${day}: no slot available for section`, context.options.debugLimit);
    return false;
  }

  if (placementIndex !== effectiveFirstOpen) {
    addDebug(
      debugLogs || [],
      `${unit.label} failed at ${day} slot ${placement.slots[0].slot_order}: no-gap rule requires slot ${daySlots[effectiveFirstOpen].slot_order}`,
      context.options.debugLimit
    );
    return false;
  }

  return true;
};

export const isValidAssignment = (state, unit, placement, context, debugLogs = null) => {
  const limit = context.options.debugLimit;
  const day = placement.slots[0].day;

  if (!isNoGapPlacement(state, unit, placement, context, debugLogs)) {
    return false;
  }

  try {
    validateRoomCapacity(unit.section, placement.room);
  } catch (error) {
    addDebug(debugLogs || [], `${unit.label} failed in room ${placement.room.room_no}: ${error.message}`, limit);
    if (context.options.strictRoomCapacity) throw error;
    return false;
  }

  for (const slot of placement.slots) {
    if (hasResource(state.sectionBusy, slot.day, slot.slot_id, unit.section_id)) {
      addDebug(debugLogs || [], `${unit.label} failed at ${slot.day} slot ${slot.slot_order}: section already busy`, limit);
      return false;
    }
    if (hasResource(state.teacherBusy, slot.day, slot.slot_id, placement.teacher.teacher_id)) {
      addDebug(debugLogs || [], `${unit.label} failed at ${slot.day} slot ${slot.slot_order}: teacher ${placement.teacher.name} busy`, limit);
      return false;
    }
    if (hasResource(state.roomBusy, slot.day, slot.slot_id, placement.room.room_id)) {
      addDebug(debugLogs || [], `${unit.label} failed at ${slot.day} slot ${slot.slot_order}: room ${placement.room.room_no} busy`, limit);
      return false;
    }
  }

  if (!teacherCanTake(state, placement.teacher, placement.slots[0].day, unit.duration)) {
    addDebug(debugLogs || [], `${unit.label} failed at ${placement.slots[0].day}: teacher workload limit`, limit);
    return false;
  }

  const sectionDayCount = getNestedCount(state.sectionDayCount, unit.section_id, placement.slots[0].day);
  if (sectionDayCount + unit.duration > (unit.section.max_slots_per_day || 6)) {
    addDebug(debugLogs || [], `${unit.label} failed at ${placement.slots[0].day}: section daily slot limit`, limit);
    return false;
  }

  if (unit.isLab && placement.slots.length !== 2) {
    addDebug(debugLogs || [], `${unit.label} failed: lab requires exactly 2 continuous slots`, limit);
    return false;
  }

  return true;
};

const canPlace = isValidAssignment;

const hasSameSubjectNearSlot = (state, unit, placement) =>
  state.assignments.some((row) =>
    row.section_id === unit.section_id &&
    row.subject_id === unit.subject_id &&
    row.day === placement.slots[0].day &&
    Math.abs(row.slot_order - placement.slots[0].slot_order) === 1 &&
    row.blockId !== placement.blockId
  );

const placementSoftCost = (state, unit, placement, context) => {
  const day = placement.slots[0].day;
  const slotOrder = placement.slots[0].slot_order;
  const subjectDayCount = getNestedCount(state.subjectDayCount, `${unit.section_id}:${unit.subject_id}`, day);
  const sectionDayCount = getNestedCount(state.sectionDayCount, unit.section_id, day);
  const targetSlots = getSectionTargetSlotsPerDay(context, unit.section_id);
  const sectionOverTargetPenalty = Math.max(0, sectionDayCount + unit.duration - targetSlots) * 180;
  const lowerLoadDayPenalty = hasLowerLoadDay(state, context, unit.section_id, day) ? 140 : 0;
  const teacherDayCount = getNestedCount(state.teacherDayHours, placement.teacher.teacher_id, day);
  const subjectSessionsToday = getNestedCount(state.subjectDaySessionCount, getSubjectDayKey(unit.section_id, unit.subject_id), day);
  const subjectRepeatPenalty = Math.max(0, subjectSessionsToday - maxSubjectSessionsPerDay(unit, context) + 1) * (unit.isLab ? 220 : 120);
  const labSameStartCount = unit.isLab ? getNestedCount(state.labStartCount, unit.section_id, slotOrder) : 0;
  const consecutivePenalty = hasSameSubjectNearSlot(state, unit, placement) ? (unit.isLab ? 360 : 220) : 0;
  const roomType = getRoomType(placement.room);
  const assignedRoomId = getNestedCount(state.sectionRoomByType, unit.section_id, roomType);
  const roomChangePenalty = assignedRoomId && assignedRoomId !== placement.room.room_id ? 260 : 0;

  // Strong penalty so each lab starts at a different slot across days —
  // avoids all practicals stacking at the same time.
  const labStackPenalty = unit.isLab ? labSameStartCount * 500 : 0;

  const labSatBonus = (unit.isLab && day === "SAT") ? -300 : 0;

  return (
    subjectDayCount * 70 +
    subjectRepeatPenalty +
    sectionOverTargetPenalty +
    lowerLoadDayPenalty +
    labStackPenalty +
    consecutivePenalty +
    roomChangePenalty +
    teacherDayCount * 8 +
    sectionDayCount * 5 +
    Math.abs(slotOrder - ((state.assignments.length % 3) + 2)) * 2 +
    labSatBonus
  );
};

const placeUnit = (state, unit, placement) => {
  const blockId = `${unit.section_id}-${unit.subject_id}-${unit.index}-${Date.now()}-${Math.random()}`;
  const roomType = getRoomType(placement.room);

  if (!getNestedCount(state.sectionRoomByType, unit.section_id, roomType)) {
    setNestedValue(state.sectionRoomByType, unit.section_id, roomType, placement.room.room_id);
  }

  for (const slot of placement.slots) {
    occupyResource(state.sectionBusy, slot.day, slot.slot_id, unit.section_id);
    occupyResource(state.teacherBusy, slot.day, slot.slot_id, placement.teacher.teacher_id);
    occupyResource(state.roomBusy, slot.day, slot.slot_id, placement.room.room_id);
    incrementNestedCount(state.sectionDayCount, unit.section_id, slot.day, 1);
    incrementNestedCount(state.subjectDayCount, `${unit.section_id}:${unit.subject_id}`, slot.day, 1);
    state.assignments.push({
      blockId,
      unit_key: unit.unit_key,
      section_id: unit.section_id,
      section_name: unit.section.name,
      subject_id: unit.subject_id,
      subject_name: unit.subject.name,
      teacher_id: placement.teacher.teacher_id,
      teacher_name: placement.teacher.name,
      room_id: placement.room.room_id,
      room_no: placement.room.room_no,
      slot_id: slot.slot_id,
      day: slot.day,
      slot_order: slot.slot_order,
      is_lab: unit.isLab,
      class_date: placement.class_date,
    });
  }
  incrementNestedCount(state.subjectDaySessionCount, getSubjectDayKey(unit.section_id, unit.subject_id), placement.slots[0].day, 1);
  if (unit.isLab) {
    incrementNestedCount(state.labStartCount, unit.section_id, placement.slots[0].slot_order, 1);
    state.sectionLabAssignedCount.set(
      unit.section_id,
      (state.sectionLabAssignedCount.get(unit.section_id) || 0) + 1
    );
    const labDayKey = `${unit.section_id}:${unit.subject_id}`;
    if (!state.labAssignedDays.has(labDayKey)) state.labAssignedDays.set(labDayKey, new Set());
    state.labAssignedDays.get(labDayKey).add(placement.slots[0].day);
  }
  incrementTeacherHours(state, placement.teacher.teacher_id, placement.slots[0].day, unit.duration);
};

const unplaceUnit = (state, unit, placement, previousLength) => {
  const roomType = getRoomType(placement.room);

  for (const slot of placement.slots) {
    releaseResource(state.sectionBusy, slot.day, slot.slot_id, unit.section_id);
    releaseResource(state.teacherBusy, slot.day, slot.slot_id, placement.teacher.teacher_id);
    releaseResource(state.roomBusy, slot.day, slot.slot_id, placement.room.room_id);
    incrementNestedCount(state.sectionDayCount, unit.section_id, slot.day, -1);
    incrementNestedCount(state.subjectDayCount, `${unit.section_id}:${unit.subject_id}`, slot.day, -1);
  }
  incrementNestedCount(state.subjectDaySessionCount, getSubjectDayKey(unit.section_id, unit.subject_id), placement.slots[0].day, -1);
  if (unit.isLab) {
    incrementNestedCount(state.labStartCount, unit.section_id, placement.slots[0].slot_order, -1);
    state.sectionLabAssignedCount.set(
      unit.section_id,
      Math.max((state.sectionLabAssignedCount.get(unit.section_id) || 0) - 1, 0)
    );
    const labDayKey = `${unit.section_id}:${unit.subject_id}`;
    const labStillAssignedOnDay = state.assignments.some((row) =>
      row.section_id === unit.section_id && row.subject_id === unit.subject_id &&
      row.day === placement.slots[0].day && row.is_lab
    );
    if (!labStillAssignedOnDay) state.labAssignedDays.get(labDayKey)?.delete(placement.slots[0].day);
  }
  incrementTeacherHours(state, placement.teacher.teacher_id, placement.slots[0].day, -unit.duration);
  state.assignments.length = previousLength;

  const roomStillUsed = state.assignments.some((row) =>
    row.section_id === unit.section_id && row.room_id === placement.room.room_id
  );
  if (!roomStillUsed) state.sectionRoomByType.get(unit.section_id)?.delete(roomType);
};

const buildUnits = (context) => {
  const units = [];
  for (const item of shuffleArray(context.sectionSubjects)) {
    const weeklyHours = Math.max(Number(item.subject.weekly_hours) || (item.subject.is_lab ? 2 : 1), 0);
    const duration = item.subject.is_lab ? 2 : 1;
    const sessions = Math.floor(weeklyHours / duration);

    for (let index = 0; index < sessions; index++) {
      units.push({
        unit_key: `${item.section.section_id}:${item.subject.subject_id}:${index}`,
        section_id: item.section.section_id,
        section: item.section,
        subject_id: item.subject.subject_id,
        subject: item.subject,
        teachers: item.teachers,
        rooms: item.rooms,
        isLab: !!item.subject.is_lab,
        duration,
        totalSessions: sessions,
        index,
        label: `${item.section.name} / ${item.subject.name} #${index + 1}`,
      });
    }
  }
  return units;
};

const sortDaysForUnit = (unit, state, context) => {
  const days = shuffleArray(context.availableDays);

  return days.sort((a, b) => {
    const aLoad = getNestedCount(state.sectionDayCount, unit.section_id, a);
    const bLoad = getNestedCount(state.sectionDayCount, unit.section_id, b);
    const loadDiff = aLoad - bLoad;

    if (!unit.isLab) return loadDiff;

    // For labs: prefer SAT first so its limited slots are reserved for practicals
    // before weekday theory classes crowd them out.
    const aSat = a === "SAT" ? -1 : 0;
    const bSat = b === "SAT" ? -1 : 0;
    const satPriority = aSat - bSat;
    if (satPriority !== 0) return satPriority;

    // Then prefer days that already have a consecutive free pair ready
    const aReady = getEffectiveFirstOpenIndex(state, unit, context, a) >= 0;
    const bReady = getEffectiveFirstOpenIndex(state, unit, context, b) >= 0;

    // Tiebreak: prefer days with fewer total slots used (less crowded)
    const aDaySlots = context.slotsByDay[a]?.length || 0;
    const bDaySlots = context.slotsByDay[b]?.length || 0;
    const slotCountDiff = bDaySlots - aDaySlots;

    return Number(bReady) - Number(aReady) || loadDiff || slotCountDiff;
  });
};

const createPlacementOptions = (unit, state, context, collectDebug = false) => {
  const options = [];
  const debugLogs = collectDebug ? [] : null;

  if (!unit.teachers.length) {
    addDebug(debugLogs || [], `${unit.label} failed: no teacher available`, context.options.debugLimit);
    return { options, debugLogs: debugLogs || [] };
  }

  if (!unit.rooms.length) {
    addDebug(debugLogs || [], `${unit.label} failed: no room available`, context.options.debugLimit);
    return { options, debugLogs: debugLogs || [] };
  }

  const capacityValidRooms = unit.rooms.filter((room) => room.capacity >= unit.section.strength);
  if (!capacityValidRooms.length) {
    const largestRoom = [...unit.rooms].sort((a, b) => b.capacity - a.capacity)[0];
    const message = `${unit.label} failed: no valid room. Largest room capacity ${largestRoom?.capacity ?? 0} is less than section strength ${unit.section.strength}`;
    addDebug(debugLogs || [], message, context.options.debugLimit);
    if (context.options.strictRoomCapacity) throw new Error(message);
    return { options, debugLogs: debugLogs || [] };
  }

  for (const day of sortDaysForUnit(unit, state, context)) {
    const daySlots = context.slotsByDay[day] || [];

    // For labs: collect ALL valid consecutive free pairs so the optimizer can
    // pick different start times and avoid every practical landing at the same slot.
    // For theory: keep the no-gap rule (only the first open index).
    let slotIndexes = [];
    if (unit.isLab) {
      for (let idx = 0; idx < daySlots.length - 1; idx++) {
        if (!isConsecutiveSlot(daySlots[idx], daySlots[idx + 1])) continue;
        if (hasResource(state.sectionBusy, day, daySlots[idx].slot_id, unit.section_id)) continue;
        if (hasResource(state.sectionBusy, day, daySlots[idx + 1].slot_id, unit.section_id)) continue;
        slotIndexes.push(idx);
      }
      if (!slotIndexes.length) {
        addDebug(debugLogs || [], `${unit.label} failed at ${day}: no consecutive slots available for lab`, context.options.debugLimit);
      }
    } else {
      const firstOpenIndex = getEffectiveFirstOpenIndex(state, unit, context, day);
      if (firstOpenIndex < 0) {
        addDebug(debugLogs || [], `${unit.label} failed at ${day}: no slot available`, context.options.debugLimit);
      }
      slotIndexes = firstOpenIndex >= 0 ? [firstOpenIndex] : [];
    }

    for (const i of slotIndexes) {
      const placementSlots = unit.isLab ? [daySlots[i], daySlots[i + 1]].filter(Boolean) : [daySlots[i]];
      if (unit.isLab && (!daySlots[i + 1] || !isConsecutiveSlot(daySlots[i], daySlots[i + 1]))) {
        addDebug(debugLogs || [], `${unit.label} failed at ${day}: no consecutive slots available for lab`, context.options.debugLimit);
        continue;
      }

      for (const teacher of shuffleArray(unit.teachers)) {
        const rooms = context.options.roomMode === "flexible"
          ? [...capacityValidRooms].sort((a, b) => b.capacity - a.capacity)
          : shuffleArray(capacityValidRooms);
        for (const room of rooms) {
          const placement = {
            teacher,
            room,
            slots: placementSlots,
            class_date: context.dateForDay[day],
            randomTieBreaker: Math.random(),
          };
          if (canPlace(state, unit, placement, context, debugLogs)) {
            options.push(placement);
          }
        }
      }
    }
  }

  options.sort((a, b) => {
    const costDiff = placementSoftCost(state, unit, a, context) - placementSoftCost(state, unit, b, context);
    return costDiff || a.randomTieBreaker - b.randomTieBreaker;
  });

  return { options, debugLogs: debugLogs || [] };
};

const orderUnitsByHeuristic = (units, state, context) =>
  shuffleArray(units)
    .map((unit) => ({
      unit,
      optionsCount: createPlacementOptions(unit, state, context).options.length,
      randomTieBreaker: Math.random(),
    }))
    .sort((a, b) => {
      if (a.unit.isLab !== b.unit.isLab) return a.unit.isLab ? -1 : 1;
      const aOptions = a.optionsCount;
      const bOptions = b.optionsCount;
      return aOptions - bOptions ||
        b.unit.duration - a.unit.duration ||
        a.randomTieBreaker - b.randomTieBreaker;
    })
    .map((entry) => entry.unit);


/**
 * Pre-pass: place all lab units first, spreading them across different days
 * AND different start slots so no two labs share the same time.
 */
const placeLabsFirst = (labUnits, state, context, debugLogs) => {
  const usedDaySlot = new Set();

  const ordered = shuffleArray(labUnits).map((unit) => ({
    unit,
    options: createPlacementOptions(unit, state, context).options,
  })).sort((a, b) => a.options.length - b.options.length);

  for (const { unit } of ordered) {
    const refreshed = createPlacementOptions(unit, state, context).options;
    if (!refreshed.length) {
      addDebug(debugLogs, `Lab pre-pass: no options for ${unit.label}`, context.options.debugLimit);
      return false;
    }
    const fresh = refreshed.filter((p) => !usedDaySlot.has(`${p.slots[0].day}:${p.slots[0].slot_order}`));
    const chosen = fresh.length ? fresh[0] : refreshed[0];
    placeUnit(state, unit, chosen);
    usedDaySlot.add(`${chosen.slots[0].day}:${chosen.slots[0].slot_order}`);
    addDebug(debugLogs, `Lab pre-pass placed ${unit.label} on ${chosen.slots[0].day} slot ${chosen.slots[0].slot_order}`, context.options.debugLimit);
  }
  return true;
};

export const backtrackingScheduler = (context) => {
  const debugLogs = [];
  const baseUnits = buildUnits(context);
  const labUnits = baseUnits.filter((u) => u.isLab);
  const theoryUnits = baseUnits.filter((u) => !u.isLab);
  let totalNodes = 0;
  let bestOverall = makeState(context);
  let completeState = null;
  let timedOut = false;

  const runAttempt = (attemptNo) => {
    const startedAt = Date.now();
    const state = makeState(context);

    // Place all labs first to lock their consecutive slots before theory fills them
    const labsOk = placeLabsFirst(shuffleArray(labUnits), state, context, debugLogs);
    if (!labsOk) {
      addDebug(debugLogs, `Attempt ${attemptNo}: lab pre-pass failed, continuing with mixed order`, context.options.debugLimit);
    }

    // Remaining units = everything not yet placed (labs already placed if labsOk)
    const assignedKeys = new Set(state.assignments.map((a) => a.unit_key).filter(Boolean));
    const remainingAfterLabs = baseUnits.filter((u) => !assignedKeys.has(u.unit_key));
    const units = orderUnitsByHeuristic(shuffleArray(remainingAfterLabs), state, context);
    let nodes = 0;
    let best = cloneState(state);
    let attemptTimedOut = false;

    addDebug(debugLogs, `Backtracking attempt ${attemptNo} started (labs pre-placed: ${labsOk})`, context.options.debugLimit);

    const search = (remainingUnits) => {
      nodes++;
      if (nodes > context.options.maxBacktrackingNodes || Date.now() - startedAt > context.options.backtrackingTimeMs) {
        attemptTimedOut = true;
        return false;
      }
      if (state.assignments.length > best.assignments.length) best = cloneState(state);
      if (!remainingUnits.length) return true;

      let selectedIndex = -1;
      let selectedOptions = null;
      let selectedFailures = [];
      let zeroOptionIndex = -1;
      let zeroOptionFailures = [];

      for (let i = 0; i < remainingUnits.length; i++) {
        const collectDebug = debugLogs.length < context.options.debugLimit;
        const { options, debugLogs: failures } = createPlacementOptions(
          remainingUnits[i],
          state,
          context,
          collectDebug
        );

        if (!options.length) {
          if (zeroOptionIndex < 0 || remainingUnits[i].duration > remainingUnits[zeroOptionIndex].duration) {
            zeroOptionIndex = i;
            zeroOptionFailures = failures;
          }
          continue;
        }

        if (
          selectedOptions === null ||
          options.length < selectedOptions.length ||
          (options.length === selectedOptions.length && remainingUnits[i].duration > remainingUnits[selectedIndex].duration)
        ) {
          selectedIndex = i;
          selectedOptions = options;
          selectedFailures = failures;
        }
      }

      if (zeroOptionIndex >= 0) {
        const unit = remainingUnits[zeroOptionIndex];
        zeroOptionFailures.forEach((log) => addDebug(debugLogs, log, context.options.debugLimit));
        addDebug(debugLogs, `${unit.label} could not be placed: no valid teacher/room/slot combination`, context.options.debugLimit);
        return false;
      }

      const unit = remainingUnits[selectedIndex];
      selectedFailures.forEach((log) => addDebug(debugLogs, log, context.options.debugLimit));

      const nextRemaining = remainingUnits.filter((_, index) => index !== selectedIndex);
      for (const placement of selectedOptions) {
        const previousLength = state.assignments.length;
        placeUnit(state, unit, placement);
        if (search(nextRemaining)) return true;
        unplaceUnit(state, unit, placement, previousLength);
      }

      return false;
    };

    const complete = search(units);
    totalNodes += nodes;
    timedOut = timedOut || attemptTimedOut;
    return { complete, state, best };
  };

  for (let attempt = 1; attempt <= (context.options.maxAttempts || 3); attempt++) {
    const attemptResult = runAttempt(attempt);
    const attemptState = attemptResult.complete ? attemptResult.state : attemptResult.best;
    if (attemptState.assignments.length > bestOverall.assignments.length) bestOverall = cloneState(attemptState);
    if (attemptResult.complete) {
      completeState = attemptResult.state;
      break;
    }
  }

  const assignedBeforeFallback = new Set((completeState || bestOverall).assignments.map((a) => a.unit_key).filter(Boolean));
  const fallbackState = completeState || cloneState(bestOverall);
  const remainingBeforeFallback = baseUnits.filter((unit) => !assignedBeforeFallback.has(unit.unit_key));

  if (!completeState && remainingBeforeFallback.length) {
    addDebug(debugLogs, `Fallback started for ${remainingBeforeFallback.length} remaining subject session(s)`, context.options.debugLimit);
    let pendingFallback = remainingBeforeFallback;
    let madeProgress = true;

    while (pendingFallback.length && madeProgress) {
      madeProgress = false;
      const stillPending = [];

      for (const unit of orderUnitsByHeuristic(pendingFallback, fallbackState, context)) {
        const { options, debugLogs: failures } = createPlacementOptions(unit, fallbackState, context, true);
        failures.forEach((log) => addDebug(debugLogs, log, context.options.debugLimit));
        if (!options.length) {
          stillPending.push(unit);
          continue;
        }
        placeUnit(fallbackState, unit, options[0]);
        madeProgress = true;
        addDebug(debugLogs, `Fallback assigned ${unit.label} to ${options[0].slots[0].day} slot ${options[0].slots[0].slot_order}`, context.options.debugLimit);
      }

      pendingFallback = stillPending;
    }

    for (const unit of pendingFallback) {
      addDebug(debugLogs, `Fallback failed for ${unit.label}: no hard-valid free slot`, context.options.debugLimit);
    }
  }

  const resultState = completeState || fallbackState;
  const assignedAfterFallback = new Set(resultState.assignments.map((a) => a.unit_key).filter(Boolean));
  const unassigned = baseUnits.filter((unit) => !assignedAfterFallback.has(unit.unit_key));

  return {
    timetable: resultState.assignments.map(cloneAssignment),
    complete: unassigned.length === 0,
    nodes: totalNodes,
    timedOut,
    unassignedUnits: unassigned.length,
    unassignedDetails: unassigned.map((unit) => ({
      section: unit.section.name,
      subject: unit.subject.name,
      subject_id: unit.subject_id,
      remaining: unit.duration,
      reason: "No hard-valid teacher/room/slot combination found",
    })),
    debugLogs,
  };
};

export const detectHardConstraintViolations = (timetable, context) => {
  const issues = [];
  const sectionSlots = new Set();
  const teacherSlots = new Set();
  const roomSlots = new Set();
  const teacherWeek = new Map();
  const teacherDay = new Map();
  const blocks = new Map();
  const sectionDayRows = new Map();

  for (const row of timetable) {
    const sectionKey = `${row.section_id}:${row.day}:${row.slot_id}`;
    const teacherKey = `${row.teacher_id}:${row.day}:${row.slot_id}`;
    const roomKey = `${row.room_id}:${row.day}:${row.slot_id}`;
    if (sectionSlots.has(sectionKey)) issues.push(`Section conflict: section ${row.section_id} at ${row.day} slot ${row.slot_order}`);
    if (teacherSlots.has(teacherKey)) issues.push(`Teacher conflict: teacher ${row.teacher_id} at ${row.day} slot ${row.slot_order}`);
    if (roomSlots.has(roomKey)) issues.push(`Room conflict: room ${row.room_id} at ${row.day} slot ${row.slot_order}`);
    sectionSlots.add(sectionKey);
    teacherSlots.add(teacherKey);
    roomSlots.add(roomKey);

    const section = context.sectionById.get(row.section_id);
    const room = context.roomById.get(row.room_id);
    if (section && room && room.capacity < section.strength) {
      issues.push(`Room capacity conflict: room ${room.room_no} capacity ${room.capacity} is less than ${section.name} strength ${section.strength}`);
    }

    const sectionDayKey = `${row.section_id}:${row.day}`;
    if (!sectionDayRows.has(sectionDayKey)) sectionDayRows.set(sectionDayKey, []);
    sectionDayRows.get(sectionDayKey).push(row);

    teacherWeek.set(row.teacher_id, (teacherWeek.get(row.teacher_id) || 0) + 1);
    const dayKey = `${row.teacher_id}:${row.day}`;
    teacherDay.set(dayKey, (teacherDay.get(dayKey) || 0) + 1);
    if (row.is_lab) {
      if (!blocks.has(row.blockId)) blocks.set(row.blockId, []);
      blocks.get(row.blockId).push(row);
    }
  }

  for (const [teacherId, hours] of teacherWeek.entries()) {
    const teacher = context.teacherById.get(teacherId);
    if (teacher && hours > (teacher.max_hours_per_week || 30)) {
      issues.push(`Teacher workload conflict: ${teacher.name} exceeds weekly limit`);
    }
  }

  for (const [dayKey, hours] of teacherDay.entries()) {
    const [teacherId] = dayKey.split(":");
    const teacher = context.teacherById.get(Number(teacherId));
    if (teacher && hours > (teacher.max_hours_per_day || 6)) {
      issues.push(`Teacher workload conflict: ${teacher.name} exceeds daily limit`);
    }
  }

  for (const [blockId, rows] of blocks.entries()) {
    const sorted = rows.sort((a, b) => a.slot_order - b.slot_order);
    if (sorted.length !== 2 || sorted[0].day !== sorted[1].day || sorted[1].slot_order !== sorted[0].slot_order + 1) {
      issues.push(`Lab continuity conflict: block ${blockId} is not two continuous slots`);
    }
  }

  for (const [sectionDayKey, rows] of sectionDayRows.entries()) {
    const [sectionId, day] = sectionDayKey.split(":");
    const daySlots = context.slotsByDay[day] || [];

    // Build set of indexes occupied by labs — treated as filled, not gaps
    const labOccupiedIndexes = new Set(
      rows
        .filter((row) => row.is_lab)
        .map((row) => daySlots.findIndex((slot) => slot.slot_id === row.slot_id))
        .filter((index) => index >= 0)
    );

    const theoryRows = rows.filter((row) => !row.is_lab);
    const theoryIndexes = theoryRows
      .map((row) => daySlots.findIndex((slot) => slot.slot_id === row.slot_id))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);

    if (!theoryIndexes.length) continue;

    const maxIndex = theoryIndexes[theoryIndexes.length - 1];
    const theorySet = new Set(theoryIndexes);

    // A true gap = slot occupied by neither theory nor lab
    for (let index = 0; index <= maxIndex; index++) {
      if (!theorySet.has(index) && !labOccupiedIndexes.has(index)) {
        const section = context.sectionById.get(Number(sectionId));
        issues.push(`No-gap conflict: ${section?.name || sectionId} has an empty slot before later classes on ${day}`);
        break;
      }
    }
  }

  return issues;
};

export const calculateScore = (timetable, context) => {
  let score = 10000;
  const issues = detectHardConstraintViolations(timetable, context);
  score -= issues.length * 1000;

  const bySectionDay = new Map();
  const byTeacherDay = new Map();
  const subjectDays = new Map();
  const subjectDailySessions = new Map();
  const labStarts = new Map();

  for (const row of timetable) {
    const sectionDayKey = `${row.section_id}:${row.day}`;
    if (!bySectionDay.has(sectionDayKey)) bySectionDay.set(sectionDayKey, []);
    bySectionDay.get(sectionDayKey).push(row);

    const teacherDayKey = `${row.teacher_id}:${row.day}`;
    byTeacherDay.set(teacherDayKey, (byTeacherDay.get(teacherDayKey) || 0) + 1);

    const subjectKey = `${row.section_id}:${row.subject_id}`;
    if (!subjectDays.has(subjectKey)) subjectDays.set(subjectKey, new Map());
    const dayMap = subjectDays.get(subjectKey);
    dayMap.set(row.day, (dayMap.get(row.day) || 0) + 1);

    if (row.is_lab) {
      const labKey = `${row.section_id}:${row.subject_id}:${row.blockId}`;
      if (!labStarts.has(labKey)) labStarts.set(labKey, row.slot_order);
      else labStarts.set(labKey, Math.min(labStarts.get(labKey), row.slot_order));
      if (!subjectDailySessions.has(subjectKey)) subjectDailySessions.set(subjectKey, new Map());
      const sessionMap = subjectDailySessions.get(subjectKey);
      sessionMap.set(row.day, new Set([...(sessionMap.get(row.day) || new Set()), row.blockId]));
    } else {
      if (!subjectDailySessions.has(subjectKey)) subjectDailySessions.set(subjectKey, new Map());
      const sessionMap = subjectDailySessions.get(subjectKey);
      sessionMap.set(row.day, new Set([...(sessionMap.get(row.day) || new Set()), row.blockId]));
    }
  }

  for (const rows of bySectionDay.values()) {
    const sorted = rows.sort((a, b) => a.slot_order - b.slot_order);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].subject_id === sorted[i - 1].subject_id && sorted[i].blockId !== sorted[i - 1].blockId) score -= 35;
    }

    // Only count gaps among theory slots — labs can legitimately appear after a gap
    const theoryOrders = sorted.filter((row) => !row.is_lab).map((row) => row.slot_order);
    if (theoryOrders.length) {
      const min = Math.min(...theoryOrders);
      const max = Math.max(...theoryOrders);
      const gaps = max - min + 1 - theoryOrders.length;
      score -= gaps * 12;
      score -= Math.max(0, context.maxSlotsPerDay - theoryOrders.length) * 3;
    }
  }

  for (const dayMap of subjectDays.values()) {
    const counts = Array.from(dayMap.values());
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    score -= (max - min) * 20;
    score += dayMap.size * 8;
  }

  for (const [subjectKey, dayMap] of subjectDailySessions.entries()) {
    const subject = context.subjectById.get(Number(subjectKey.split(":")[1]));
    for (const sessions of dayMap.values()) {
      score -= Math.max(0, sessions.size - 1) * (subject?.is_lab ? 90 : 45);
    }
  }

  const labStartUsage = new Map();
  for (const [labKey, startOrder] of labStarts.entries()) {
    const sectionSubject = labKey.split(":").slice(0, 2).join(":");
    const usageKey = `${sectionSubject}:${startOrder}`;
    labStartUsage.set(usageKey, (labStartUsage.get(usageKey) || 0) + 1);
  }

  for (const repeatCount of labStartUsage.values()) {
    score -= Math.max(0, repeatCount - 1) * 45;
  }

  for (const teacher of context.teachers) {
    const loads = context.availableDays.map((day) => byTeacherDay.get(`${teacher.teacher_id}:${day}`) || 0);
    const max = Math.max(...loads);
    const min = Math.min(...loads);
    score -= (max - min) * 6;
  }

  return { score, hardViolations: issues };
};

const removeBlock = (timetable, blockId) => timetable.filter((row) => row.blockId !== blockId);

const stateFromTimetable = (context, timetable) => {
  const state = makeState(context);
  const labStarts = new Map();
  const sessionBlocks = new Map();

  for (const row of timetable) {
    const unit = {
      section_id: row.section_id,
      subject_id: row.subject_id,
      isLab: row.is_lab,
    };
    occupyResource(state.sectionBusy, row.day, row.slot_id, row.section_id);
    occupyResource(state.teacherBusy, row.day, row.slot_id, row.teacher_id);
    occupyResource(state.roomBusy, row.day, row.slot_id, row.room_id);
    incrementNestedCount(state.sectionDayCount, row.section_id, row.day, 1);
    incrementNestedCount(state.subjectDayCount, `${unit.section_id}:${unit.subject_id}`, row.day, 1);
    incrementTeacherHours(state, row.teacher_id, row.day, 1);
    state.assignments.push(cloneAssignment(row));

    if (!sessionBlocks.has(row.blockId)) sessionBlocks.set(row.blockId, row);

    const room = context.roomById.get(row.room_id);
    if (room && !getNestedCount(state.sectionRoomByType, row.section_id, getRoomType(room))) {
      setNestedValue(state.sectionRoomByType, row.section_id, getRoomType(room), row.room_id);
    }

    if (row.is_lab) {
      const blockRows = labStarts.get(row.blockId) || [];
      blockRows.push(row);
      labStarts.set(row.blockId, blockRows);
      const labDayKey = `${row.section_id}:${row.subject_id}`;
      if (!state.labAssignedDays.has(labDayKey)) state.labAssignedDays.set(labDayKey, new Set());
      state.labAssignedDays.get(labDayKey).add(row.day);
    }
  }

  for (const rows of labStarts.values()) {
    const first = rows.sort((a, b) => a.slot_order - b.slot_order)[0];
    if (first) {
      incrementNestedCount(state.labStartCount, first.section_id, first.slot_order, 1);
      state.sectionLabAssignedCount.set(
        first.section_id,
        (state.sectionLabAssignedCount.get(first.section_id) || 0) + 1
      );
    }
  }

  for (const row of sessionBlocks.values()) {
    incrementNestedCount(
      state.subjectDaySessionCount,
      getSubjectDayKey(row.section_id, row.subject_id),
      row.day,
      1
    );
  }

  return state;
};

export const mutateTimetable = (timetable, context, debugLogs = []) => {
  if (timetable.length < 1) return timetable;
  const blockIds = Array.from(new Set(timetable.map((row) => row.blockId)));
  const blockId = blockIds[randomInt(blockIds.length)];
  const blockRows = timetable.filter((row) => row.blockId === blockId);
  const first = blockRows[0];
  const section = context.sectionById.get(first.section_id);
  const subject = context.subjectById.get(first.subject_id);
  const unit = {
    unit_key: first.unit_key,
    section_id: first.section_id,
    section,
    subject_id: first.subject_id,
    subject,
    teachers: context.teachersBySubjectSection.get(`${first.section_id}:${first.subject_id}`) || [],
    rooms: context.roomsBySubject.get(first.subject_id) || [],
    isLab: !!first.is_lab,
    duration: first.is_lab ? 2 : 1,
    totalSessions: context.subjectSessionCount.get(`${first.section_id}:${first.subject_id}`) || 1,
    index: randomInt(100000),
    label: `${section?.name || first.section_id} / ${subject?.name || first.subject_id}`,
  };

  const reduced = removeBlock(timetable, blockId);
  const state = stateFromTimetable(context, reduced);
  const { options } = createPlacementOptions(unit, state, context);
  if (!options.length) return timetable;

  const placement = options[randomInt(options.length)];
  placeUnit(state, unit, placement);
  addDebug(debugLogs, `Mutation moved ${unit.label} to ${placement.slots[0].day} slot ${placement.slots[0].slot_order}`, context.options.debugLimit);
  return state.assignments.map(cloneAssignment);
};

export const optimizeTimetable = (initialTimetable, context) => {
  const debugLogs = [];
  let current = initialTimetable.map(cloneAssignment);
  let currentScore = calculateScore(current, context).score;
  let best = current.map(cloneAssignment);
  let bestScore = currentScore;
  let temperature = context.options.annealingStartTemp;

  for (let i = 0; i < context.options.annealingIterations; i++) {
    const candidate = mutateTimetable(current, context, debugLogs);
    const candidateScore = calculateScore(candidate, context).score;
    const delta = candidateScore - currentScore;
    const accept = delta >= 0 || Math.exp(delta / Math.max(temperature, 0.0001)) > Math.random();

    if (accept) {
      current = candidate;
      currentScore = candidateScore;
    }

    if (candidateScore > bestScore) {
      best = candidate.map(cloneAssignment);
      bestScore = candidateScore;
      addDebug(debugLogs, `Annealing improved score to ${bestScore} at iteration ${i + 1}`, context.options.debugLimit);
    }

    temperature *= context.options.annealingCoolingRate;
    if (temperature < 0.01) break;
  }

  return { timetable: best, score: bestScore, debugLogs };
};

export const generateInitialTimetable = (rawContext, options = {}) => {
  const context = {
    ...rawContext,
    options: { ...DEFAULT_LIMITS, ...options },
  };
  const initial = backtrackingScheduler(context);
  const initialScore = calculateScore(initial.timetable, context);
  return {
    ...initial,
    score: initialScore.score,
    hardViolations: initialScore.hardViolations,
  };
};

const buildSubjectSessionCount = (sectionSubjects) => {
  const counts = new Map();
  for (const item of sectionSubjects) {
    const duration = item.subject.is_lab ? 2 : 1;
    const weeklyHours = Math.max(Number(item.subject.weekly_hours) || duration, 0);
    counts.set(
      getSubjectDayKey(item.section.section_id, item.subject.subject_id),
      Math.floor(weeklyHours / duration)
    );
  }
  return counts;
};

const buildSectionRequiredSlotCount = (sectionSubjects) => {
  const counts = new Map();
  for (const item of sectionSubjects) {
    const duration = item.subject.is_lab ? 2 : 1;
    const weeklyHours = Math.max(Number(item.subject.weekly_hours) || duration, 0);
    const requiredSlots = Math.floor(weeklyHours / duration) * duration;
    counts.set(
      item.section.section_id,
      (counts.get(item.section.section_id) || 0) + requiredSlots
    );
  }
  return counts;
};

export const buildOptimizerContext = (data, options = {}) => {
  const deduplicatedSlots = [];
  const seen = new Set();
  for (const slot of data.slots) {
    const slotKey = `${slot.day}:${slot.slot_order}`;
    if (!seen.has(slotKey)) {
      seen.add(slotKey);
      deduplicatedSlots.push(slot);
    }
  }

  const slotsByDay = {};
  for (const slot of deduplicatedSlots) {
    if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
    slotsByDay[slot.day].push(slot);
  }
  for (const day of Object.keys(slotsByDay)) slotsByDay[day].sort((a, b) => a.slot_order - b.slot_order);

  const availableDays = DAY_ORDER.filter((day) => slotsByDay[day]?.length);
  const teachers = Array.from(data.teacherById.values());
  const subjectSessionCount = buildSubjectSessionCount(data.sectionSubjects);
  const sectionRequiredSlotCount = buildSectionRequiredSlotCount(data.sectionSubjects);

  return {
    ...data,
    slots: deduplicatedSlots,
    slotsByDay,
    availableDays,
    teachers,
    subjectSessionCount,
    sectionRequiredSlotCount,
    maxSlotsPerDay: Math.max(...Object.values(slotsByDay).map((slots) => slots.length), 0),
    sectionById: new Map(data.sections.map((section) => [section.section_id, section])),
    subjectById: new Map(data.sectionSubjects.map((item) => [item.subject.subject_id, item.subject])),
    roomById: new Map(
      Array.from(data.roomsBySubject.values())
        .flat()
        .map((room) => [room.room_id, room])
    ),
    options: { ...DEFAULT_LIMITS, ...options },
  };
};

export { DAY_ORDER, isConsecutiveSlot };