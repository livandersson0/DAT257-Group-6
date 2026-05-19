import { describe, it, expect } from 'vitest'
import { daysLeft, getBadge, locationLabel, offsetDate } from '../utils/helpers'

describe('daysLeft', () => {
  it('returnerar 0 för dagens datum', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(daysLeft(today)).toBe(0)
  })

  it('returnerar negativt tal för passerat datum', () => {
    expect(daysLeft('2020-01-01')).toBeLessThan(0)
  })

  it('returnerar positivt tal för framtida datum', () => {
    const future = offsetDate(5)
    expect(daysLeft(future)).toBe(5)
  })
})

describe('getBadge', () => {
  it('returnerar badge-expired för utgångna varor', () => {
    expect(getBadge(-1).cls).toBe('badge-expired')
  })

  it('returnerar Idag! för 0 dagar', () => {
    expect(getBadge(0).text).toBe('Idag!')
  })

  it('returnerar badge-urgent för 1-2 dagar', () => {
    expect(getBadge(2).cls).toBe('badge-urgent')
  })

  it('returnerar badge-soon för 3-5 dagar', () => {
    expect(getBadge(4).cls).toBe('badge-soon')
  })

  it('returnerar badge-ok för mer än 5 dagar', () => {
    expect(getBadge(10).cls).toBe('badge-ok')
  })
})

describe('locationLabel', () => {
  it('översätter fridge till Kyl', () => {
    expect(locationLabel('fridge')).toBe('Kyl')
  })

  it('översätter freezer till Frys', () => {
    expect(locationLabel('freezer')).toBe('Frys')
  })

  it('översätter pantry till Skafferi', () => {
    expect(locationLabel('pantry')).toBe('Skafferi')
  })

  it('returnerar okänd plats som den är', () => {
    expect(locationLabel('garage')).toBe('garage')
  })
})