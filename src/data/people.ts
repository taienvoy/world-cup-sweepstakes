// The 13 participants. `slots` is how many teams each is drawn.
// Taiwo and Quentin get 2 each; everyone else gets 4 (9*0 ... 11*4 + 2*2 = 48).
// Quentin has Brazil pinned as a guaranteed headliner (see lib/draw.ts).

export interface Person {
  id: string;
  name: string;
  photo: string;
  slots: number;
}

export const PEOPLE: Person[] = [
  { id: "emily", name: "Emily", photo: "https://ca.slack-edge.com/T024FV495-U0AT03B99E3-5b2efd4070d3-512", slots: 4 },
  { id: "francis", name: "Francis", photo: "https://ca.slack-edge.com/T024FV495-U094WQUBRGB-8734053ca798-512", slots: 4 },
  { id: "jot", name: "Jot", photo: "https://ca.slack-edge.com/T024FV495-U0AEKRW204D-a6e46754e0e3-512", slots: 4 },
  { id: "lauren", name: "Lauren", photo: "https://ca.slack-edge.com/T024FV495-U06C9F7E4MV-1239cc5f6d06-512", slots: 4 },
  { id: "lydia", name: "Lydia", photo: "https://ca.slack-edge.com/T024FV495-U09HT89B00P-b86a74021e9e-512", slots: 4 },
  { id: "michael", name: "Michael", photo: "https://ca.slack-edge.com/T024FV495-U03NS36U61X-13fee87eacff-512", slots: 4 },
  { id: "olga", name: "Olga", photo: "https://ca.slack-edge.com/T024FV495-U03LJ2H623F-478a5a7cbf9e-512", slots: 4 },
  { id: "peter", name: "Peter", photo: "https://ca.slack-edge.com/T024FV495-U02RQJKB6TH-7bcba3425774-512", slots: 4 },
  { id: "quentin", name: "Quentin", photo: "https://ca.slack-edge.com/T024FV495-UE1T8736Z-7c431bf85266-512", slots: 2 },
  { id: "querren", name: "Querren", photo: "https://ca.slack-edge.com/T024FV495-U09J1AY5Z8B-e961b0d02759-512", slots: 4 },
  { id: "shez", name: "Shez", photo: "https://ca.slack-edge.com/T024FV495-U09DPUJ8G8M-b740e50e8838-512", slots: 4 },
  { id: "shreya", name: "Shreya", photo: "https://ca.slack-edge.com/T024FV495-U07NN7LQ90W-ea9692976ebd-512", slots: 4 },
  { id: "taiwo", name: "Taiwo", photo: "https://ca.slack-edge.com/T024FV495-U0B1L5DJRNW-4f36f984e11e-512", slots: 2 },
];

// Quentin's guaranteed team.
export const PINNED: Record<string, string> = {
  quentin: "Brazil",
};
