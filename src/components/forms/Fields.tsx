'use client';

import React from 'react';
import { Field, Input, Select, Textarea, fieldAria } from '@/components/ui/Field';
import { cn } from '@/lib/utils';
import { useFieldError } from './ActionForm';

interface BaseProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

const idFor = (name: string) => `f-${name}`;

export const TextField: React.FC<
  BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'id'>
> = ({ name, label, hint, required, className, ...input }) => {
  const error = useFieldError(name);
  const id = idFor(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Input id={id} name={name} required={required} {...fieldAria(id, error, hint)} {...input} />
    </Field>
  );
};

export const TextAreaField: React.FC<
  BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'id'>
> = ({ name, label, hint, required, className, rows = 4, ...textarea }) => {
  const error = useFieldError(name);
  const id = idFor(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Textarea id={id} name={name} rows={rows} required={required} {...fieldAria(id, error, hint)} {...textarea} />
    </Field>
  );
};

export interface Option {
  value: string;
  label: string;
}

export const SelectField: React.FC<
  BaseProps & {
    options: Option[];
    placeholder?: string;
    defaultValue?: string;
  } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'id' | 'defaultValue'>
> = ({ name, label, hint, required, className, options, placeholder, defaultValue, ...select }) => {
  const error = useFieldError(name);
  const id = idFor(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Select id={id} name={name} required={required} defaultValue={defaultValue ?? ''} {...fieldAria(id, error, hint)} {...select}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
};

export const CheckboxField: React.FC<{
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  className?: string;
}> = ({ name, label, description, defaultChecked, className }) => {
  const id = idFor(name);
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-describedby={description ? `${id}-desc` : undefined}
        className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-border-strong accent-action-primary"
      />
      <div>
        <label htmlFor={id} className="font-medium text-text-primary">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export const FileField: React.FC<BaseProps & { accept: string; multiple?: boolean }> = ({
  name,
  label,
  hint,
  required,
  className,
  accept,
  multiple,
}) => {
  const error = useFieldError(name);
  const id = idFor(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        {...fieldAria(id, error, hint)}
        className="block w-full rounded-lg border border-border-strong bg-surface-base text-base text-text-secondary file:mr-4 file:min-h-touch file:cursor-pointer file:border-0 file:border-r file:border-border-subtle file:bg-surface-subtle file:px-4 file:font-semibold file:text-text-primary hover:file:bg-surface-sunken"
      />
    </Field>
  );
};

/** Grup kolom dengan judul — memecah formulir panjang jadi bagian yang mudah dipindai. */
export const FieldGroup: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <fieldset className="space-y-4 rounded-lg border border-border-subtle bg-surface-base p-5 sm:p-6">
    {/* float: legend tampil sebagai judul biasa, bukan menumpang di garis border */}
    <legend className="float-left w-full font-display text-base font-bold text-text-primary">{title}</legend>
    <div className="clear-both space-y-4">
      {description && <p className="-mt-3 text-sm text-text-secondary">{description}</p>}
      {children}
    </div>
  </fieldset>
);
