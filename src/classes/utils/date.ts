import dayjs from 'dayjs';

export class DateTime {
  private instance!: dayjs.Dayjs;

  constructor(sourceDateTime?: DateTime | string | Date) {
    if (sourceDateTime === undefined || sourceDateTime === null) {
      this.instance = dayjs();
    } else if (typeof sourceDateTime === 'string' || sourceDateTime instanceof Date) {
      this.instance = dayjs(sourceDateTime);
    } else {
      this.instance = dayjs(sourceDateTime.instance);
    }
  }

  static at(sourceDateTime: DateTime | string | Date): DateTime {
    return new DateTime(sourceDateTime);
  }

  add(amount: number, unit: dayjs.ManipulateType): DateTime {
    this.instance = this.instance.add(amount, unit);
    return this;
  }

  subtract(amount: number, unit: dayjs.ManipulateType): DateTime {
    this.instance = this.instance.subtract(amount, unit);
    return this;
  }

  format(formatString: string): string {
    return this.instance.format(formatString);
  }

  day(): number {
    return this.instance.day();
  }

  toString(): string {
    return this.instance.toString();
  }

  toISOString(): string {
    return this.instance.toISOString();
  }

  isAfter(targetDate: DateTime | string | Date): boolean {
    const date = new DateTime(targetDate);
    console.log('isAfter date', date.toString());
    return this.instance.isAfter(date.instance);
  }

  diff(targetDate: DateTime | string | Date, unit: dayjs.QUnitType, precise?: boolean): number {
    const date = new DateTime(targetDate);
    return this.instance.diff(date.instance, unit, precise);
  }

  daysDiff(targetDate: DateTime | string | Date): number {
    const date = new DateTime(targetDate);
    return this.instance.startOf('day').diff(date.instance.startOf('day'), 'day');
  }

  compareDuration(targetDate: DateTime | string | Date, unit: dayjs.QUnitType): number {
    const date = new DateTime(targetDate);
    return date.instance.diff(this.instance, unit);
  }

  isBefore(targetDate: DateTime | string | Date): boolean {
    const date = new DateTime(targetDate);
    return this.instance.isBefore(date.instance);
  }

  static today(): Date {
    return dayjs().toDate();
  }

}
