import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);

  const formContext = useFormContext();

  const { getFieldState } = formContext;

  const fieldState = getFieldState(fieldContext.name, formContext.formState);

  return {
    name: fieldContext.name,
    ...fieldState,
  };
}

const FormItemContext = React.createContext<{
  id: string;
}>({ id: "" });

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error } = useFormField();

  return (
    <Label className={cn(error && "text-destructive", className)} {...props} />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error } = useFormField();

  return <Slot aria-invalid={!!error} {...props} />;
}

function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  const { error } = useFormField();

  const body = error?.message || children;

  if (!body) return null;

  return (
    <p
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body as React.ReactNode}
    </p>
  );
}

export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage };
