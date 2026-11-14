// How members get in and keep their things: cards for the door and lockers in the changing room.
export interface AccessSettings {
  // Members can be issued a card to check in and out.
  cardsEnabled: boolean;
  // The gym has lockers members can use.
  lockersEnabled: boolean;
  // Lockers are locked with the member's card; otherwise with a key or padlock.
  lockersUseCard: boolean;
}
