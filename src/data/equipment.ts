import type { EquipmentId } from '@/domain/types'

export interface EquipmentInfo {
  id: EquipmentId
  name: string
  hint: string
}

export const EQUIPMENT: EquipmentInfo[] = [
  { id: 'kettlebell', name: 'Kettlebell', hint: 'Goblet squats, swings, carries' },
  { id: 'dumbbells', name: 'Dumbbells', hint: 'Used like a kettlebell' },
  { id: 'straps', name: 'Suspension straps', hint: 'TRX-style, door anchor' },
  { id: 'bands', name: 'Resistance bands', hint: 'Loop or mini bands' },
  { id: 'balanceBoard', name: 'Balance board', hint: 'Indo board or wobble board' },
  { id: 'jumpRope', name: 'Jump rope', hint: 'Cardio intervals' },
  { id: 'foamRoller', name: 'Foam roller', hint: 'Recovery & cool-down' },
]

export const equipmentName = (id: EquipmentId) => EQUIPMENT.find((e) => e.id === id)?.name ?? id
