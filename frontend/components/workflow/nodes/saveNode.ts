/* eslint-disable @typescript-eslint/no-explicit-any */

export function saveNodeChanges(id: string, newData: any, nodes: any[]) {
  return nodes.map((n) => {
    if (n.id !== id) return n;

    // INPUT NODE (special case)
    if (n.type === "input") {
      return {
        ...n,
        data: {
          ...n.data,
          label: newData.label ?? n.data.label,
          fields: {
            variables: newData.fields?.variables || [],
          },
          pass: newData.pass ?? n.data.pass, // ⬅ SAVE PASS HERE TOO
        },
      };
    }

    // NORMAL NODES
    const updatedFields = { ...n.data.fields };

    for (const key in newData.fields || {}) {
      const value = newData.fields[key];
      updatedFields[key] = value;
    }

    return {
      ...n,
      data: {
        ...n.data,
        label: newData.label ?? n.data.label,
        fields: updatedFields,
        pass: newData.pass ?? n.data.pass,
      },
    };
  });
}
