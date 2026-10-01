import { gate } from "@/lib/store";
import { Header } from "../../ui";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  await gate("products");
  return (
    <>
      <Header title="New product" />
      <ProductForm />
    </>
  );
}
