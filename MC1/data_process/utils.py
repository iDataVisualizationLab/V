def f(source, sourceUnique, no_financial):
    selected = no_financial.loc[no_financial['Source'] == source]
    return source, set(list(selected.Target))