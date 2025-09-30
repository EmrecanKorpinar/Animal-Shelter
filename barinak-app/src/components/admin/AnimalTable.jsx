

import React from "react";
import AdminAnimalCard from "./AdminAnimalCard";

export default function AnimalTable({ animals, onEdit, onDelete }) {
  return (
    <div className="flex flex-wrap justify-center items-start gap-6 p-4">
      {animals.map((animal) => (
        <AdminAnimalCard
          key={animal.id}
          animal={animal}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}