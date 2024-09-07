import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { invalidPipeArgumentError } from './invalid-pipe-argument-error';
import { strToNumber } from '@lib/strings';
import { isValue } from '@lib/primatives';

export enum Base2Unit {
  B = 'B',
  KiB = 'KiB',
  MiB = 'MiB',
  GiB = 'GiB',
  TiB = 'TiB',
  PiB = 'PiB',
}

export enum Base10Unit {
  B = 'B',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
  TB = 'TB',
  PB = 'PB',
}

const Base2UnitValues = Object.values(Base2Unit);
const Base10UnitValues = Object.values(Base10Unit);

/**
 *
 */
@Pipe({
  name: 'appBytes',
  standalone: true,
})
export class BytesPipe implements PipeTransform {
  constructor(
    @Inject(LOCALE_ID) private _locale: string,
    private _decimalPipe: DecimalPipe
  ) {}

  transform(
    value: number | string,
    base?: '2' | '10',
    digitsInfo?: string,
    locale?: string
  ): string | null;
  transform(
    value: null | undefined,
    base?: '2' | '10',
    digitsInfo?: string,
    locale?: string
  ): null;
  transform(
    value: number | string | null | undefined,
    base: '2' | '10',
    digitsInfo: string,
    locale?: string
  ): string | null;

  /**
   * @param value The value to be formatted.
   * @param base Specifies whether to use base 2 or base 10 units.
   * @param digitsInfo Sets digit and decimal representation.
   * @param locale Specifies what locale format rules to use.
   */
  transform(
    value: number | string | null | undefined,
    base?: '2' | '10',
    digitsInfo?: string,
    locale?: string
  ): string | null {
    if (!isValue(value)) {
      return null;
    }

    base ||= '2';
    digitsInfo ||= '1.0-2';
    locale ||= this._locale;

    try {
      const num = strToNumber(value);
      return formatBytes(num, base, digitsInfo, locale, this._decimalPipe);
    } catch (error) {
      throw invalidPipeArgumentError(BytesPipe, value);
    }
  }
}

/**
 * Formats a number as a human-readable file size.
 */
export function formatBytes(
  value: number,
  base: '2' | '10',
  digitsInfo: string,
  locale: string,
  decimalPipe: DecimalPipe
): string {
  return base === '2'
    ? formatBase2Bytes(value, digitsInfo, locale, decimalPipe)
    : formatBase10Bytes(value, digitsInfo, locale, decimalPipe);
}

/**
 * Formats a number as a human-readable file size using base 2.
 */
export function formatBase2Bytes(
  value: number,
  digitsInfo: string,
  locale: string,
  decimalPipe: DecimalPipe
): string {
  const exp = Math.floor(Math.log(value) / Math.log(1024));
  const valueInUnit = value / Math.pow(1024, exp);
  const unitStr = Base2UnitValues[exp];

  return `${decimalPipe.transform(valueInUnit, digitsInfo, locale)} ${unitStr}`;
}

/**
 * Formats a number as a human-readable file size using base 10.
 */
export function formatBase10Bytes(
  value: number,
  digitsInfo: string,
  locale: string,
  decimalPipe: DecimalPipe
): string {
  const exp = Math.floor(Math.log(value) / Math.log(1000));
  const valueInUnit = value / Math.pow(1000, exp);
  const unitStr = Base10UnitValues[exp];

  return `${decimalPipe.transform(valueInUnit, digitsInfo, locale)} ${unitStr}`;
}
