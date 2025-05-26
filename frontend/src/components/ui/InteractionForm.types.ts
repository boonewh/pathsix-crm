import type { InteractionFormData } from "@/types";

export type InteractionFormProps = {
  form: InteractionFormData;
  updateForm: React.Dispatch<React.SetStateAction<InteractionFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
};