export default defineI18nConfig(() => ({
  pluralRules: {
    // Polish has separate forms for 2-4 and 5+: "zero | one | few | many"
    pl: (choice: number) => {
      if (choice === 0) return 0
      if (choice === 1) return 1
      const mod10 = choice % 10
      const mod100 = choice % 100
      return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 2 : 3
    },
  },
}))
