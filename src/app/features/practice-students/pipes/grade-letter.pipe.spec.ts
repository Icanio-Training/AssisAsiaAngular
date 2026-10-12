import { GradeLetterPipe } from './grade-letter.pipe';

// A pure pipe is a plain class — test it without TestBed.
describe('GradeLetterPipe', () => {
  const pipe = new GradeLetterPipe();

  it.each([
    [100, 'A'],
    [85, 'A'],
    [84, 'B'],
    [70, 'B'],
    [55, 'C'],
    [40, 'D'],
    [39, 'F'],
    [0, 'F'],
  ])('maps %i to %s', (grade, letter) => {
    expect(pipe.transform(grade)).toBe(letter);
  });

  it('adds a label when asked', () => {
    expect(pipe.transform(90, true)).toBe('A (Excellent)');
  });

  it('shows a dash for missing values', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });
});
