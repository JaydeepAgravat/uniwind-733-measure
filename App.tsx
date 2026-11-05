// Based on harveyappleton/uniwind-data-attr-repro (same grid, class strings and timing method).
// The runtime "fix" toggle is removed: this app measures whichever Uniwind build is installed.
import './global.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { getBuildName, resolveCounter } from './resolveCounter';

const CELLS = 400;
const RENDERS = 30;

const PLAIN = 'w-3 h-3 m-px rounded-sm bg-sky-500 border border-sky-700';
const WITH_DATA = `${PLAIN} data-[selected=true]:bg-indigo-900`;

type Mode = 'plain' | 'data';
type Result = { ms: number; resolves: number };

const SCENARIOS: Array<{ id: Mode; label: string }> = [
  { id: 'plain', label: 'Plain classes' },
  { id: 'data', label: '+ data-[] class' },
];

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function Grid({ mode, selected, onCommit }: { mode: Mode; selected: boolean; onCommit: () => void }) {
  useLayoutEffect(onCommit);

  return (
    <View className='flex-row flex-wrap'>
      {Array.from({ length: CELLS }, (_, i) => (
        <View key={i} data-selected={selected && i % 2 === 0} className={mode === 'data' ? WITH_DATA : PLAIN} />
      ))}
    </View>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>('data');
  const [selected, setSelected] = useState(false);
  const [, setTick] = useState(0);
  const [runs, setRuns] = useState<Array<Record<Mode, Result>>>([]);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);
  const total = useRef(0);
  const build = getBuildName();

  const onCommit = () => {
    if (startedAt.current) {
      total.current += performance.now() - startedAt.current;
      startedAt.current = 0;
    }
  };

  const measure = async (scenario: Mode): Promise<Result> => {
    setMode(scenario);
    await nextFrame();
    await nextFrame();
    total.current = 0;
    resolveCounter.count = 0;
    for (let i = 0; i < RENDERS; i++) {
      startedAt.current = performance.now();
      setTick((t) => t + 1);
      await nextFrame();
      await nextFrame();
    }
    return { ms: total.current / RENDERS, resolves: resolveCounter.count / RENDERS };
  };

  const run = async () => {
    setRunning(true);
    setSelected(false);
    const result = { plain: await measure('plain'), data: await measure('data') };
    setRuns((previous) => [...previous, result]);
    setMode('data');
    setRunning(false);
    console.log(
      `[measure] build=${getBuildName()} plain ${result.plain.ms.toFixed(1)} ms, ${result.plain.resolves.toFixed(0)} re-parses | data ${result.data.ms.toFixed(1)} ms, ${result.data.resolves.toFixed(0)} re-parses`,
    );
  };

  return (
    <ScrollView className='flex-1 bg-white' contentContainerClassName='px-4 pt-16 pb-10 gap-4'>
      <Text className='text-xl font-bold'>Uniwind #733 measurement</Text>
      <Text testID='build' className='text-base'>
        Uniwind build: <Text className='font-bold'>{build}</Text>
      </Text>
      <Text className='text-gray-700'>
        Re-renders {CELLS} squares {RENDERS} times with unchanged props, per row. Re-parses = class strings
        resolved per render because the cache missed ({CELLS} = nothing cached).
      </Text>
      <Pressable testID='run' disabled={running} onPress={run} className='bg-black rounded-lg p-3 items-center'>
        <Text className='text-white font-bold'>{running ? 'Measuring…' : `Run comparison (#${runs.length + 1})`}</Text>
      </Pressable>
      <View className='border border-gray-300 rounded-lg'>
        <View className='flex-row p-2 bg-gray-100 rounded-t-lg'>
          <Text className='w-10 font-bold'>Run</Text>
          <Text className='flex-1 font-bold'>Class string</Text>
          <Text className='w-20 text-right font-bold'>ms/render</Text>
          <Text className='w-20 text-right font-bold'>re-parses</Text>
        </View>
        {runs.flatMap((result, index) =>
          SCENARIOS.map((scenario) => (
            <View key={`${index}-${scenario.id}`} className='flex-row p-2 border-t border-gray-200'>
              <Text className='w-10'>{index + 1}</Text>
              <Text className='flex-1'>{scenario.label}</Text>
              <Text className='w-20 text-right'>{result[scenario.id].ms.toFixed(1)}</Text>
              <Text className='w-20 text-right'>{result[scenario.id].resolves.toFixed(0)}</Text>
            </View>
          )),
        )}
      </View>
      <Pressable
        testID='selected'
        disabled={running}
        onPress={() => {
          setMode('data');
          setSelected((value) => !value);
        }}
        className='flex-row items-center justify-between border border-gray-300 rounded-lg p-3'
      >
        <Text>data-selected on every other square</Text>
        <Text className={selected ? 'font-bold text-green-700' : 'font-bold text-gray-500'}>{selected ? 'ON' : 'OFF'}</Text>
      </Pressable>
      <Grid mode={mode} selected={selected} onCommit={onCommit} />
    </ScrollView>
  );
}
