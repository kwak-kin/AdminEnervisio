import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const rateSchema = z.object({
  rate: z
    .string()
    .min(1, "Rate is required")
    .refine((val) => !isNaN(val), "Rate must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Rate must be greater than zero"),
  effectiveDate: z.date({
    required_error: "Effective date is required",
    invalid_type_error: "Effective date must be a valid date",
  }),
  notes: z.string().optional(),
});

const RateForm = ({ initialData, isEditMode, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      rate: initialData ? initialData.rate.toString() : "",
      effectiveDate: initialData ? initialData.effectiveFrom : new Date(),
      notes: initialData?.notes || "",
    },
  });

  const effectiveDate = watch("effectiveDate");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="rate" className="form-label">
          Rate per kWh (PHP)
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">₱</span>
          </div>
          <input
            type="text"
            id="rate"
            className={`form-input pl-7 ${
              errors.rate ? "border-[#dc3545]" : ""
            }`}
            placeholder="0.00"
            aria-invalid={errors.rate ? "true" : "false"}
            aria-describedby={errors.rate ? "rate-error" : undefined}
            {...register("rate")}
          />
        </div>
        {errors.rate && (
          <p id="rate-error" className="form-error" role="alert">
            {errors.rate.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="effectiveDate" className="form-label">
          Effective Date
        </label>
        <DatePicker
          id="effectiveDate"
          selected={effectiveDate}
          onChange={(date) => setValue("effectiveDate", date)}
          className={`form-input w-full ${
            errors.effectiveDate ? "border-[#dc3545]" : ""
          }`}
          dateFormat="MMMM d, yyyy"
          aria-invalid={errors.effectiveDate ? "true" : "false"}
          aria-describedby={
            errors.effectiveDate ? "effectiveDate-error" : undefined
          }
        />
        {errors.effectiveDate && (
          <p id="effectiveDate-error" className="form-error" role="alert">
            {errors.effectiveDate.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {!isEditMode
            ? "Adding a new rate will automatically archive the previous current rate."
            : "Editing this rate will not change its archived status."}
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="form-label">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          className="form-input"
          rows="3"
          placeholder="Add any additional notes about this rate"
          {...register("notes")}
        ></textarea>
      </div>

      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#e6ecf5] text-[#1e386d] px-4 py-2 rounded font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e6ecf5] focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2"
        >
          {isEditMode ? "Update Rate" : "Add Rate"}
        </button>
      </div>
    </form>
  );
};

export default RateForm;
