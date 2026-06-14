import { useEffect, useRef, useState } from "react";

const IGNORED_MIDI_STATUSES = [248, 250, 251, 252, 254];

export function useMidiInput(onNoteOn) {
  const [connected, setConnected] = useState(false);
  const onNoteOnRef = useRef(onNoteOn);
  const lastEventRef = useRef(0);

  useEffect(() => {
    onNoteOnRef.current = onNoteOn;
  });

  useEffect(() => {
    let midiAccess = null;

    const bindInputs = () => {
      const inputs = [...midiAccess.inputs.values()];
      const connectedInputs = inputs.filter(
        (input) => input.state === "connected",
      );

      setConnected(connectedInputs.length > 0);

      inputs.forEach((input) => {
        input.onmidimessage = (event) => {
          const [status, note, velocity] = event.data;

          if (IGNORED_MIDI_STATUSES.includes(status)) {
            return;
          }

          if (status === 144 && velocity > 0) {
            const now = Date.now();

            if (now - lastEventRef.current < 250) {
              return;
            }

            lastEventRef.current = now;
            onNoteOnRef.current?.(note);
          }
        };
      });
    };

    const initMidi = async () => {
      try {
        if (!navigator.requestMIDIAccess) {
          setConnected(false);
          return;
        }

        midiAccess = await navigator.requestMIDIAccess();
        bindInputs();
        midiAccess.onstatechange = bindInputs;
      } catch (error) {
        console.error(error);
        setConnected(false);
      }
    };

    initMidi();

    return () => {
      if (!midiAccess) {
        return;
      }

      midiAccess.onstatechange = null;

      [...midiAccess.inputs.values()].forEach((input) => {
        input.onmidimessage = null;
      });
    };
  }, []);

  return connected;
}
